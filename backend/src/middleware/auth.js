const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const { calculateLoyalty } = require('../services/loyaltyService');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT u.*, c.membership_start_date, c.company_name, c.is_approved FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.id = ?').get(decoded.id);

    if (!user) return res.status(401).json({ error: 'User not found' });

    const loyalty = calculateLoyalty(user.membership_start_date);

    req.user = {
      id: user.id,
      email: user.email,
      companyId: user.company_id,
      isAdmin: user.is_admin === 1,
      company: {
        name: user.company_name,
        isApproved: user.is_approved === 1,
        membershipStartDate: user.membership_start_date,
        ...loyalty,
      },
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;
