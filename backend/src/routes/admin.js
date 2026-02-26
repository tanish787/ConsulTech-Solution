const express = require('express');
const { getDb } = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

router.use(auth, requireAdmin);

router.get('/pending', (req, res) => {
  const db = getDb();
  const companies = db.prepare('SELECT * FROM companies WHERE is_approved = 0').all();
  res.json(companies);
});

router.post('/approve/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('UPDATE companies SET is_approved = 1 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Company not found' });
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  res.json(company);
});

router.put('/companies/:id/date', (req, res) => {
  const { membership_start_date } = req.body;
  if (!membership_start_date) return res.status(400).json({ error: 'membership_start_date required' });

  const db = getDb();
  const result = db.prepare('UPDATE companies SET membership_start_date = ? WHERE id = ?').run(membership_start_date, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Company not found' });
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  res.json(company);
});

router.delete('/listings/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM listings WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Listing not found' });
  res.json({ message: 'Listing deleted' });
});

module.exports = router;
