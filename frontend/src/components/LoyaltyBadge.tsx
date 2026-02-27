import React from 'react';
import { LoyaltyLevel } from '../types';

interface LoyaltyBadgeProps {
  level: LoyaltyLevel;
  className?: string;
}

const LoyaltyBadge: React.FC<LoyaltyBadgeProps> = ({ level, className = '' }) => {
  const badgeStyles: Record<LoyaltyLevel, string> = {
    Explorer: 'bg-gray-100 text-gray-700',
    Participant: 'bg-emerald-100 text-emerald-700',
    Contributor: 'bg-amber-100 text-amber-700',
    Champion: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
  };

  const icons: Record<LoyaltyLevel, string> = {
    Explorer: '○',
    Participant: '◐',
    Contributor: '◑',
    Champion: '●',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide ${badgeStyles[level]} ${className}`}>
      <span className="text-base">{icons[level]}</span>
      <span>{level}</span>
    </div>
  );
};

export default LoyaltyBadge;
