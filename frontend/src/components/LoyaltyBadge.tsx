import React from 'react';
import { LoyaltyLevel } from '../types';

interface LoyaltyBadgeProps {
  level: LoyaltyLevel;
  className?: string;
}

const LoyaltyBadge: React.FC<LoyaltyBadgeProps> = ({ level, className = '' }) => {
  const badgeStyles: Record<LoyaltyLevel, string> = {
    Bronze: 'bg-amber-50 text-amber-700 border border-amber-200',
    Silver: 'bg-slate-100 text-slate-700 border border-slate-300',
    Gold: 'bg-yellow-50 text-yellow-700 border border-yellow-300',
    Platinum: 'bg-blue-50 text-blue-700 border border-blue-300',
  };

  const icons: Record<LoyaltyLevel, string> = {
    Bronze: '◯',
    Silver: '◐',
    Gold: '◑',
    Platinum: '●',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide ${badgeStyles[level]} ${className}`}>
      <span className="text-base">{icons[level]}</span>
      <span>{level}</span>
    </div>
  );
};

export default LoyaltyBadge;
