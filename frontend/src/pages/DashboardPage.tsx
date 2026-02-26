import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoyaltyBadge from '../components/LoyaltyBadge';
import Navbar from '../components/Navbar';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const company = user?.company;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, <span className="text-teal-600">{company?.company_name || user?.email}</span>!
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's your CIC membership overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loyalty Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Membership Status</h2>
            {company ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <LoyaltyBadge level={company.level} />
                  <span className="text-2xl font-bold text-gray-900">{company.level}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Duration:</span> {company.duration || 'New member'}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Active months:</span> {company.monthsActive}
                </p>
                {!company.isApproved && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                    ⏳ Your account is pending admin approval.
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400">Loading...</p>
            )}
          </div>

          {/* Next Level Card */}
          {company?.nextLevel && (
            <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl border border-teal-200 p-6">
              <h2 className="font-semibold text-teal-700 mb-4 text-sm uppercase tracking-wide">Next Level</h2>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-600">Progress to</span>
                <LoyaltyBadge level={company.nextLevel} />
              </div>
              <p className="text-sm text-gray-700">{company.nextLevelMessage}</p>
            </div>
          )}

          {/* Privileges Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Your Privileges</h2>
            <ul className="space-y-2">
              {company?.privileges?.map(p => (
                <li key={p} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span className="capitalize">{p.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Quick Links</h2>
            <div className="space-y-2">
              <Link
                to="/directory"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-teal-50 text-teal-700 transition-colors"
              >
                <span>🏢</span> <span className="text-sm font-medium">Browse Member Directory</span>
              </Link>
              <Link
                to="/listings"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-teal-50 text-teal-700 transition-colors"
              >
                <span>📋</span> <span className="text-sm font-medium">View Listings & Events</span>
              </Link>
              {user?.companyId && (
                <Link
                  to={`/companies/${user.companyId}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-teal-50 text-teal-700 transition-colors"
                >
                  <span>✏️</span> <span className="text-sm font-medium">Edit Company Profile</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
