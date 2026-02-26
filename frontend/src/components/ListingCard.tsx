import React from 'react';
import LoyaltyBadge from './LoyaltyBadge';

interface ListingCardProps {
  listing: {
    id: number;
    title: string;
    description?: string;
    category: string;
    company_name: string;
    created_at: string;
    membership_start_date?: string;
    company_id: number;
  };
  currentCompanyId?: number;
  onEdit?: (listing: any) => void;
  onDelete?: (id: number) => void;
  loyaltyLevel?: string;
}

const categoryColors: Record<string, string> = {
  resource: 'bg-purple-100 text-purple-700',
  event: 'bg-orange-100 text-orange-700',
  session: 'bg-blue-100 text-blue-700',
  collaboration: 'bg-teal-100 text-teal-700',
};

const ListingCard: React.FC<ListingCardProps> = ({ listing, currentCompanyId, onEdit, onDelete, loyaltyLevel }) => {
  const isOwner = currentCompanyId === listing.company_id;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${categoryColors[listing.category] || 'bg-gray-100 text-gray-600'}`}>
          {listing.category}
        </span>
        <span className="text-xs text-gray-400">{new Date(listing.created_at).toLocaleDateString()}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{listing.title}</h3>
      {listing.description && <p className="text-sm text-gray-600 mb-3">{listing.description}</p>}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{listing.company_name}</span>
          {loyaltyLevel && <LoyaltyBadge level={loyaltyLevel} showLabel={false} />}
        </div>
        {isOwner && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(listing)}
                className="text-xs text-teal-600 hover:text-teal-800 font-medium"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(listing.id)}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingCard;
