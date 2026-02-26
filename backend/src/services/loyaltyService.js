const LEVELS = ['Explorer', 'Participant', 'Contributor', 'Champion'];

const PRIVILEGES = {
  Explorer: ['view_network'],
  Participant: ['view_network', 'attend_events'],
  Contributor: ['view_network', 'attend_events', 'create_listings'],
  Champion: ['view_network', 'attend_events', 'create_listings', 'featured_badge', 'priority_visibility'],
};

const BADGES = {
  Explorer: '🌱',
  Participant: '🔵',
  Contributor: '🟢',
  Champion: '⭐',
};

function calculateLoyalty(membershipStartDate) {
  if (!membershipStartDate) {
    return {
      level: 'Explorer',
      badge: BADGES.Explorer,
      monthsActive: 0,
      privileges: PRIVILEGES.Explorer,
      nextLevel: 'Participant',
      nextLevelMessage: 'You are 3 months away from Participant! Unlock attend_events.',
    };
  }

  const start = new Date(membershipStartDate);
  const now = new Date();
  const diffMs = now - start;
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
  const monthsActive = Math.max(0, Math.floor(diffMonths));

  let level;
  if (diffMonths >= 36) {
    level = 'Champion';
  } else if (diffMonths >= 12) {
    level = 'Contributor';
  } else if (diffMonths >= 3) {
    level = 'Participant';
  } else {
    level = 'Explorer';
  }

  const currentIndex = LEVELS.indexOf(level);
  const nextLevel = currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;

  let nextLevelMessage = null;
  if (nextLevel) {
    let monthsNeeded;
    if (nextLevel === 'Participant') monthsNeeded = 3 - monthsActive;
    else if (nextLevel === 'Contributor') monthsNeeded = 12 - monthsActive;
    else if (nextLevel === 'Champion') monthsNeeded = 36 - monthsActive;

    const nextPrivilege = PRIVILEGES[nextLevel].find(p => !PRIVILEGES[level].includes(p));
    nextLevelMessage = `You are ${Math.max(0, monthsNeeded)} months away from ${nextLevel}! Unlock ${nextPrivilege}.`;
  }

  return {
    level,
    badge: BADGES[level],
    monthsActive,
    privileges: PRIVILEGES[level],
    nextLevel,
    nextLevelMessage,
  };
}

function getLevelIndex(level) {
  return LEVELS.indexOf(level);
}

module.exports = { calculateLoyalty, getLevelIndex, LEVELS };
