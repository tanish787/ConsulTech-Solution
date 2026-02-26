import React from 'react';

interface LoyaltyBadgeProps {
  level: string;
  showLabel?: boolean;
}

const styles: Record<string, string> = {
  Explorer: 'bg-gray-100 text-gray-700 border border-gray-300',
  Participant: 'bg-blue-100 text-blue-700 border border-blue-300',
  Contributor: 'bg-green-100 text-green-700 border border-green-300',
  Champion: 'bg-yellow-100 text-yellow-700 border border-yellow-400',
};

const badges: Record<string, string> = {
  Explorer: '🌱',
  Participant: '🔵',
  Contributor: '🟢',
  Champion: '⭐',
};

const LoyaltyBadge: React.FC<LoyaltyBadgeProps> = ({ level, showLabel = true }) => {
  const style = styles[level] || styles.Explorer;
  const badge = badges[level] || '🌱';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${style}`}>
      <span>{badge}</span>
      {showLabel && <span>{level}</span>}
    </span>
  );
};

export default LoyaltyBadge;
