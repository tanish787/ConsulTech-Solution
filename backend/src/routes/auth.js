const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('company_name').notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, company_name, description, industry, size, website } = req.body;
  const db = getDb();

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const company = db.prepare(
      'INSERT INTO companies (company_name, description, industry, size, website, is_approved) VALUES (?, ?, ?, ?, ?, 0)'
    ).run(company_name, description || null, industry || null, size || null, website || null);

    const hash = bcrypt.hashSync(password, 10);
    const user = db.prepare(
      'INSERT INTO users (email, password_hash, company_id) VALUES (?, ?, ?)'
    ).run(email, hash, company.lastInsertRowid);

    const token = jwt.sign({ id: user.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const db = getDb();

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
