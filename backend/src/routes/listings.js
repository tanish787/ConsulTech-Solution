const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../database');
const auth = require('../middleware/auth');
const { requireLoyaltyLevel } = require('../middleware/loyaltyAuth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const db = getDb();
  const { category } = req.query;

  let query = `
    SELECT l.*, c.company_name, c.membership_start_date
    FROM listings l
    JOIN companies c ON l.company_id = c.id
  `;
  const params = [];

  if (category) { query += ' WHERE l.category = ?'; params.push(category); }
  query += ' ORDER BY l.created_at DESC';

  const listings = db.prepare(query).all(...params);
  res.json(listings);
});

router.post('/', auth, requireLoyaltyLevel('Contributor'), [
  body('title').notEmpty(),
  body('category').isIn(['resource', 'event', 'session', 'collaboration']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, category } = req.body;
  const db = getDb();

  const result = db.prepare(
    'INSERT INTO listings (company_id, title, description, category) VALUES (?, ?, ?, ?)'
  ).run(req.user.companyId, title, description || null, category);

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(listing);
});

router.put('/:id', auth, requireLoyaltyLevel('Contributor'), (req, res) => {
  const db = getDb();
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  if (listing.company_id !== req.user.companyId && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { title, description, category } = req.body;
  db.prepare(
    'UPDATE listings SET title = COALESCE(?, title), description = COALESCE(?, description), category = COALESCE(?, category) WHERE id = ?'
  ).run(title || null, description || null, category || null, req.params.id);

  const updated = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', auth, (req, res) => {
  const db = getDb();
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  if (listing.company_id !== req.user.companyId && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.prepare('DELETE FROM listings WHERE id = ?').run(req.params.id);
  res.json({ message: 'Listing deleted' });
});

module.exports = router;
