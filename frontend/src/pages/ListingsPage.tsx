import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import apiService from '../services/apiService';
import NavBar from '../components/NavBar';
import LoyaltyBadge from '../components/LoyaltyBadge';
import CompanyLogo from '../components/CompanyLogo';
import { Listing, Company } from '../types';

const ListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [userCompany, setUserCompany] = useState<Company | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListing, setNewListing] = useState<{
    title: string;
    description: string;
    category: 'resource' | 'event' | 'collaboration' | 'session';
  }>({
    title: '',
    description: '',
    category: 'resource',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingsData, companyData] = await Promise.all([
          apiService.getAllListings(selectedCategory),
          user?.company_id ? apiService.getCompanyById(user.company_id) : null,
        ]);
        setListings(listingsData);
        setUserCompany(companyData);
      } catch (err: any) {
        setError('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, user]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.company_id) {
      setError('You must be logged in to create a listing');
      return;
    }

    try {
      const now = new Date().toISOString();
      await apiService.createListing({
        ...newListing,
        company_id: user.company_id,
        created_at: now,
        updated_at: now,
      });
      setNewListing({ title: '', description: '', category: 'resource' });
      setShowCreateForm(false);
      // Refresh listings
      const updated = await apiService.getAllListings(selectedCategory);
      setListings(updated);
    } catch (err: any) {
      setError(
        err.message || 'Failed to create listing'
      );
    }
  };

  const canCreateListings =
    userCompany &&
    (userCompany.membership_duration_months || 0) >= 3;

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'resource', label: 'Resources' },
    { value: 'event', label: 'Events' },
    { value: 'collaboration', label: 'Collaboration' },
    { value: 'session', label: 'Knowledge Sessions' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        currentPage="listings"
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Listings</h1>
          {canCreateListings && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {showCreateForm ? 'Cancel' : 'Create Listing'}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {!canCreateListings && userCompany && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              <strong>Requirement:</strong> You must have at least 3 months of membership to create listings. You currently have {userCompany.membership_duration_months || 0} months.
            </p>
          </div>
        )}

        {/* Create Listing Form */}
        {showCreateForm && canCreateListings && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Create New Listing</h2>
            <form onSubmit={handleCreateListing}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newListing.title}
                  onChange={(e) =>
                    setNewListing({ ...newListing, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Category
                </label>
                <select
                  value={newListing.category}
                  onChange={(e) =>
                    setNewListing({ ...newListing, category: e.target.value as 'resource' | 'event' | 'collaboration' | 'session' })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                >
                  <option value="resource">Resource</option>
                  <option value="event">Event</option>
                  <option value="collaboration">Collaboration</option>
                  <option value="session">Knowledge Session</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Description
                </label>
                <textarea
                  value={newListing.description}
                  onChange={(e) =>
                    setNewListing({
                      ...newListing,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                  rows={6}
                  required
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Listing
              </button>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <label className="block text-gray-700 font-semibold mb-2">
            Filter by Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-48 px-4 py-2 border rounded-lg"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {listing.company_name ?? 'Company'}
                    </p>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {listing.category}
                      </span>
                      {listing.company_loyalty_level && (
                        <LoyaltyBadge
                          level={listing.company_loyalty_level}
                          className="text-xs"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 text-sm line-clamp-3">
                  {listing.description}
                </p>

                <div className="border-t pt-4 flex items-center gap-3">
                  <CompanyLogo
                    companyName={listing.company_name ?? 'Company'}
                    logoUrl={listing.company_logo_url}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-700 font-semibold text-sm mb-0.5">
                      {listing.company_name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {listings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No listings found in this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingsPage;
