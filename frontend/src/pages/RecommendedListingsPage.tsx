import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import NavBar from '../components/NavBar';
import LoyaltyBadge from '../components/LoyaltyBadge';
import { LoyaltyLevel } from '../types';

// Template recommendation types for the Recommended Listings page (replace with API later)
interface RecommendedCompany {
  id: number;
  company_name: string;
  description: string;
  industry: string;
  loyalty_level: LoyaltyLevel;
  reason: string;
}

interface RecommendedListing {
  id: number;
  title: string;
  description: string;
  category: string;
  company_name: string;
  company_loyalty_level: LoyaltyLevel;
  reason: string;
}

// Mock recommendations - in production these would come from a recommendations API
const MOCK_RECOMMENDED_COMPANIES: RecommendedCompany[] = [
  {
    id: 2,
    company_name: 'EcoCycle Manufacturing',
    description: 'Sustainable manufacturing and recycling solutions',
    industry: 'Manufacturing',
    loyalty_level: 'Champion',
    reason: 'Similar industry focus; strong circular economy track record',
  },
  {
    id: 4,
    company_name: 'Eco Consulting Group',
    description: 'Strategy and innovation consulting for circular economy',
    industry: 'Consulting',
    loyalty_level: 'Contributor',
    reason: 'Frequent collaborators with technology and manufacturing members',
  },
  {
    id: 3,
    company_name: 'ReWaste Solutions',
    description: 'Waste reduction and circular business models',
    industry: 'Waste Management',
    loyalty_level: 'Participant',
    reason: 'Complementary services; active in CIC events',
  },
];

const MOCK_RECOMMENDED_LISTINGS: RecommendedListing[] = [
  {
    id: 2,
    title: 'Circular Economy Workshop Series',
    description: 'Monthly workshops on implementing circular principles in your business',
    category: 'event',
    company_name: 'EcoCycle Manufacturing',
    company_loyalty_level: 'Champion',
    reason: 'Matches your industry; high engagement from similar members',
  },
  {
    id: 3,
    title: 'Strategic Partnership Opportunity',
    description: 'Looking for technology partners to scale circular solutions',
    category: 'collaboration',
    company_name: 'Eco Consulting Group',
    company_loyalty_level: 'Contributor',
    reason: 'Partnership goals align with your organization profile',
  },
  {
    id: 1,
    title: 'AI-Powered Waste Classification System',
    description: 'Advanced machine learning solution for sorting waste streams',
    category: 'resource',
    company_name: 'GreenTech Solutions',
    company_loyalty_level: 'Champion',
    reason: 'Popular among technology and sustainability-focused members',
  },
];

const RecommendedListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        currentPage="recommendedListings"
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gray-900">Recommended Listings</h1>
          <p className="text-gray-500 mt-2">
            Personalized recommendations based on your organization’s profile and activity in the CIC network.
          </p>
          {user && (
            <p className="text-sm text-gray-400 mt-1">
              Recommendations are tailored to member tier, industry, and engagement. (Template data — connect a backend to personalize.)
            </p>
          )}
        </div>

        {/* Recommended companies */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-gray-900 mb-2">
            Companies we think you’ll value
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Other members that align with your interests and collaboration opportunities
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_RECOMMENDED_COMPANIES.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 cursor-pointer p-6"
                onClick={() => navigate(`/company/${company.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-medium text-gray-900 flex-1">
                    {company.company_name}
                  </h3>
                  <LoyaltyBadge level={company.loyalty_level} />
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {company.description}
                </p>
                <p className="text-xs text-emerald-600 font-medium mb-2">Why recommended</p>
                <p className="text-gray-500 text-sm italic mb-4">{company.reason}</p>
                <span className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                  View profile →
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended listings */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-gray-900 mb-2">
            Recommended listings
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Resources, events, and collaborations that match your profile
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_RECOMMENDED_LISTINGS.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 p-6"
              >
                <div className="flex gap-2 items-center mb-2">
                  <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-800 rounded capitalize">
                    {listing.category}
                  </span>
                  {listing.company_loyalty_level && (
                    <LoyaltyBadge level={listing.company_loyalty_level} className="text-xs" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {listing.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {listing.description}
                </p>
                <p className="text-xs text-emerald-600 font-medium mb-1">Why recommended</p>
                <p className="text-gray-500 text-sm italic mb-4">{listing.reason}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{listing.company_name}</span>
                  <button
                    onClick={() => navigate('/listings')}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    View in Listings →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Placeholder for future sections */}
        <section className="bg-white rounded-xl border border-gray-200 border-dashed p-8 text-center">
          <p className="text-gray-400 text-sm">
            More personalized sections (e.g. “Upcoming events”, “Suggested actions”) can be added here once the recommendations API is connected.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RecommendedListingsPage;
