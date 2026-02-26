import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoyaltyBadge from './LoyaltyBadge';

interface CompanyCardProps {
  company: {
    id: number;
    company_name: string;
    description?: string;
    level: string;
    duration?: string;
    industry?: string;
  };
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  const navigate = useNavigate();
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/companies/${company.id}`)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-lg leading-tight">{company.company_name}</h3>
        <LoyaltyBadge level={company.level} />
      </div>
      {company.industry && (
        <p className="text-xs text-teal-600 font-medium mb-2">{company.industry}</p>
      )}
      {company.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{company.description}</p>
      )}
      {company.duration && (
        <p className="text-xs text-gray-400">Member for {company.duration}</p>
      )}
    </div>
  );
};

export default CompanyCard;
