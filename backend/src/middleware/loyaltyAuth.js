const { getLevelIndex } = require('../services/loyaltyService');

function requireLoyaltyLevel(minLevel) {
  return (req, res, next) => {
    const userLevel = req.user && req.user.company && req.user.company.level;
    if (!userLevel) return res.status(403).json({ error: 'Loyalty level not determined' });

    if (getLevelIndex(userLevel) < getLevelIndex(minLevel)) {
      return res.status(403).json({ error: `This action requires ${minLevel} level or above` });
    }
    next();
  };
}

module.exports = { requireLoyaltyLevel };
