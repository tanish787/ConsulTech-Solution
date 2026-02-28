import React from 'react';

interface CompanyLogoProps {
  /** Company name – used for initials placeholder and alt text */
  companyName: string;
  /** Optional logo URL – when provided, image is shown; otherwise placeholder with initials */
  logoUrl?: string | null;
  /** Additional CSS classes (e.g. for size) */
  className?: string;
  /** Size variant for consistent placeholder sizing */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

/** Derive initials from company name (e.g. "GreenTech Solutions" → "GS") */
function getInitials(name: string): string {
  if (!name || !name.trim()) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Stable color index from company name for placeholder background */
function getPlaceholderColor(name: string): string {
  const colors = [
    'bg-emerald-100 text-emerald-700',
    'bg-blue-100 text-blue-700',
    'bg-amber-100 text-amber-700',
    'bg-gray-100 text-gray-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({
  companyName,
  logoUrl,
  className = '',
  size = 'md',
}) => {
  const sizeClass = sizeClasses[size];
  const initials = getInitials(companyName);
  const colorClass = getPlaceholderColor(companyName);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${companyName} logo`}
        className={`rounded-lg object-cover flex-shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-lg flex items-center justify-center font-semibold flex-shrink-0 ${sizeClass} ${colorClass} ${className}`}
      title={companyName}
    >
      {initials}
    </div>
  );
};

export default CompanyLogo;
