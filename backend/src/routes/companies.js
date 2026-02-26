const express = require('express');
const { getDb } = require('../database');
const auth = require('../middleware/auth');
const { calculateLoyalty } = require('../services/loyaltyService');

const router = express.Router();

function formatDuration(membershipStartDate) {
  if (!membershipStartDate) return null;
  const start = new Date(membershipStartDate);
  const now = new Date();
  const diffMs = now - start;
  const totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years > 0 && months > 0) return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
  if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${months} month${months !== 1 ? 's' : ''}`;
}

router.get('/', (req, res) => {
  const db = getDb();
  const { sort, industry, size } = req.query;

  let query = 'SELECT * FROM companies WHERE is_approved = 1';
  const params = [];

  if (industry) { query += ' AND industry = ?'; params.push(industry); }
  if (size) { query += ' AND size = ?'; params.push(size); }

  const companies = db.prepare(query).all(...params);

  let results = companies.map(c => {
    const loyalty = calculateLoyalty(c.membership_start_date);
    return { ...c, ...loyalty, duration: formatDuration(c.membership_start_date) };
  });

  if (sort === 'name') {
    results.sort((a, b) => a.company_name.localeCompare(b.company_name));
  } else if (sort === 'duration') {
    results.sort((a, b) => b.monthsActive - a.monthsActive);
  } else if (sort === 'loyalty') {
    const { getLevelIndex } = require('../services/loyaltyService');
    results.sort((a, b) => getLevelIndex(b.level) - getLevelIndex(a.level));
  }

  res.json(results);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const loyalty = calculateLoyalty(company.membership_start_date);
  const listings = db.prepare('SELECT * FROM listings WHERE company_id = ?').all(company.id);

  res.json({ ...company, ...loyalty, duration: formatDuration(company.membership_start_date), listings });
});

router.put('/:id', auth, (req, res) => {
  const db = getDb();
  const companyId = parseInt(req.params.id);

  if (req.user.companyId !== companyId && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { company_name, description, industry, size, website } = req.body;
  db.prepare(
    'UPDATE companies SET company_name = COALESCE(?, company_name), description = COALESCE(?, description), industry = COALESCE(?, industry), size = COALESCE(?, size), website = COALESCE(?, website) WHERE id = ?'
  ).run(company_name || null, description || null, industry || null, size || null, website || null, companyId);

  const updated = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
  const loyalty = calculateLoyalty(updated.membership_start_date);
  res.json({ ...updated, ...loyalty, duration: formatDuration(updated.membership_start_date) });
});

module.exports = router;
