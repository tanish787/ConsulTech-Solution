import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import apiService from '../services/apiService';
import NavBar from '../components/NavBar';
import LoyaltyBadge from '../components/LoyaltyBadge';
import { Company } from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        if (user?.company_id) {
          console.log('Fetching company with ID:', user.company_id);
          const data = await apiService.getCompanyById(user.company_id);
          console.log('Company data:', data);
          setCompany(data);
        }
      } catch (err: any) {
        console.error('Failed to load company:', err);
        // Company data not found is not necessarily an error - user may not have a company yet
        setError('');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCompany();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  if (!company)
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar
          currentPage="dashboard"
          onLogout={() => {
            logout();
            navigate('/login');
          }}
        />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome!</h1>
            <p className="text-gray-600 mb-6">Please complete your company registration to get started.</p>
            <button
              onClick={() => navigate('/directory')}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
            >
              Browse Network
            </button>
          </div>
        </div>
      </div>
    );

  const tierInfo = {
    Bronze: {
      description: 'Less than 3 months',
      privileges: ['View member network'],
    },
    Silver: {
      description: '3–12 months',
      privileges: ['View member network', 'Attend events'],
    },
    Gold: {
      description: '12–24 months',
      privileges: [
        'View member network',
        'Attend events',
        'Create and edit listings',
      ],
    },
    Platinum: {
      description: '24+ months',
      privileges: [
        'View member network',
        'Attend events',
        'Create and edit listings',
        'Featured badge',
        'Priority visibility',
      ],
    },
  };

  const currentTier =
    tierInfo[company.computed_loyalty_level || 'Bronze'] || tierInfo.Bronze;
  const nextLevel = company.next_level;
  const monthsUntilNext = company.months_until_next_level;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        currentPage="dashboard"
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-2">Your organization's membership overview</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Company Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-light text-gray-900">
                {company.company_name}
              </h2>
              <p className="text-gray-500 text-sm mt-1">Your organization</p>
            </div>
            <LoyaltyBadge level={company.computed_loyalty_level || 'Bronze'} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-gray-200 pt-6">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">
                Industry
              </p>
              <p className="text-lg text-gray-900">{company.industry}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">
                Organization Size
              </p>
              <p className="text-lg text-gray-900 capitalize">{company.size}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">
                Member Since
              </p>
              <p className="text-lg text-gray-900">
                {new Date(company.membership_start_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">
                Months Active
              </p>
              <p className="text-lg text-gray-900">{company.membership_duration_months}</p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/company/${company.id}`)}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Full Profile
          </button>
        </div>

        {/* Loyalty Tier Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Current Tier */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-4">
              Current Tier: {company.computed_loyalty_level}
            </h3>
            <p className="text-gray-600 mb-6">
              Member for {currentTier.description}
            </p>

            <div className="bg-blue-50 p-4 rounded mb-6">
              <h4 className="font-semibold text-blue-900 mb-3">
                Your Privileges:
              </h4>
              <ul className="space-y-2">
                {currentTier.privileges.map((privilege, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span className="text-gray-800">{privilege}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Next Tier */}
          {nextLevel && monthsUntilNext !== null && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-lg p-8 border-2 border-green-200">
              <h3 className="text-2xl font-bold mb-4">
                Next Tier: {nextLevel}
              </h3>
              <p className="text-lg font-semibold text-green-600 mb-2">
                {monthsUntilNext} months away
              </p>
              <p className="text-gray-700 mb-6">
                Renew your membership to unlock more privileges and increase visibility
                in the CIC network.
              </p>

              <div className="bg-white p-4 rounded mb-6">
                <h4 className="font-semibold text-green-900 mb-3">
                  New Privileges:
                </h4>
                <ul className="space-y-2">
                  {(
                    tierInfo[nextLevel as keyof typeof tierInfo]?.privileges ||
                    []
                  ).map((privilege, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-green-600">+</span>
                      <span className="text-gray-800">{privilege}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm text-gray-600">
                💡 Your loyalty progression directly increases your network visibility,
                helping strengthen collaborations and advance circular economy goals.
              </p>
            </div>
          )}

          {!nextLevel && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg p-8 border-2 border-purple-200">
              <h3 className="text-2xl font-bold mb-4">Champion Status</h3>
              <p className="text-lg font-semibold text-purple-600 mb-4">
                🏆 You've reached the highest loyalty tier!
              </p>
              <p className="text-gray-700">
                Thank you for your long-term commitment to advancing the circular
                economy. You're a key member of the CIC network.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/directory')}
              className="p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-left"
            >
              <h4 className="font-bold text-blue-900 mb-2">View Directory</h4>
              <p className="text-sm text-blue-700">
                Explore other member companies
              </p>
            </button>

            {['Contributor', 'Champion'].includes(
              company.computed_loyalty_level || ''
            ) && (
              <button
                onClick={() => navigate('/listings')}
                className="p-6 bg-green-50 rounded-lg hover:bg-green-100 transition text-left"
              >
                <h4 className="font-bold text-green-900 mb-2">Create Listing</h4>
                <p className="text-sm text-green-700">
                  Share resources or collaboration opportunities
                </p>
              </button>
            )}

            <button
              onClick={() => navigate('/listings')}
              className="p-6 bg-amber-50 rounded-lg hover:bg-amber-100 transition text-left"
            >
              <h4 className="font-bold text-amber-900 mb-2">View Listings</h4>
              <p className="text-sm text-amber-700">
                Discover resources and events
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
