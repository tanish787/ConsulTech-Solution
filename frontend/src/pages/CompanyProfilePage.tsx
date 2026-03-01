import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import apiService from '../services/apiService';
import NavBar from '../components/NavBar';
import LoyaltyBadge from '../components/LoyaltyBadge';
import { Company, Listing } from '../types';

const CompanyProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editData, setEditData] = useState<Partial<Company>>({});
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
    const fetchCompany = async () => {
      try {
        const data = await apiService.getCompanyById(id || '');
        setCompany(data);
        if (data) {
          setEditData({
            description: data.description,
            industry: data.industry,
            size: data.size,
            website: data.website,
          });
          setIsOwner(data.id === user?.company_id);
          // Fetch listings for this company
          const companyListings = await apiService.getListingsByCompany(data.id);
          setListings(companyListings);
        }
      } catch (err: any) {
        setError('Failed to load company profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCompany();
  }, [id, user]);

  const handleSave = async () => {
    try {
      await apiService.updateCompany(id || '', editData);
      // Fetch updated company data
      const updated = await apiService.getCompanyById(id || '');
      setCompany(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError('Failed to update company');
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      const now = new Date().toISOString();
      await apiService.createListing({
        ...newListing,
        company_id: company.id,
        created_at: now,
        updated_at: now,
      });
      // Refresh listings
      const updatedListings = await apiService.getListingsByCompany(company.id);
      setListings(updatedListings);
      setNewListing({ title: '', description: '', category: 'resource' });
      setShowCreateListing(false);
      setError('');
    } catch (err: any) {
      setError('Failed to create listing');
    }
  };

  // Check if user can create listings (3+ months membership)
  const canCreateListings = company && (company.membership_duration_months || 0) >= 3;
  
  // Get the loyalty level (computed or calculate it)
  const loyaltyLevel = company?.computed_loyalty_level || 'Bronze';

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
          currentPage="directory"
          onLogout={() => {
            logout();
            navigate('/login');
          }}
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <button
            onClick={() => navigate('/directory')}
            className="mb-4 text-emerald-600 hover:underline"
          >
            ← Back to Network
          </button>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Company not found</h2>
              <p className="text-gray-600 mb-6">The company you're looking for doesn't exist.</p>
              <button
                onClick={() => navigate('/directory')}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
              >
                Browse Network
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        currentPage="directory"
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => navigate('/directory')}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Back to Directory
        </button>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-8 text-white">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold">{company.company_name}</h1>
              <LoyaltyBadge level={loyaltyLevel} />
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-gray-600 text-sm font-semibold mb-2">
                  INDUSTRY
                </h3>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.industry || ''}
                    onChange={(e) =>
                      setEditData({ ...editData, industry: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                ) : (
                  <p className="text-lg">{company.industry}</p>
                )}
              </div>

              <div>
                <h3 className="text-gray-600 text-sm font-semibold mb-2">
                  COMPANY SIZE
                </h3>
                {isEditing ? (
                  <select
                    value={editData.size || ''}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        size: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="startup">Startup</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                ) : (
                  <p className="text-lg capitalize">{company.size}</p>
                )}
              </div>

              <div>
                <h3 className="text-gray-600 text-sm font-semibold mb-2">
                  MEMBER SINCE
                </h3>
                <p className="text-lg">
                  {new Date(company.membership_start_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  {company.membership_duration_months} months
                </p>
              </div>

              <div>
                <h3 className="text-gray-600 text-sm font-semibold mb-2">
                  LOYALTY LEVEL
                </h3>
                <p className="text-lg font-semibold">
                  {loyaltyLevel}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">
                DESCRIPTION
              </h3>
              {isEditing ? (
                <textarea
                  value={editData.description || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded h-24"
                />
              ) : (
                <p className="text-gray-700">{company.description}</p>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">
                WEBSITE
              </h3>
              {isEditing ? (
                <input
                  type="url"
                  value={editData.website || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, website: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              ) : (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {company.website}
                </a>
              )}
            </div>

            {isOwner && (
              <div className="border-t pt-8">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Listings Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Listings</h2>
            {isOwner && (
              <button
                onClick={() => setShowCreateListing(!showCreateListing)}
                disabled={!canCreateListings}
                className={`px-6 py-2 rounded text-white font-medium ${
                  canCreateListings
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {showCreateListing ? 'Cancel' : 'Add Listing'}
              </button>
            )}
          </div>

          {!canCreateListings && isOwner && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>Requirement:</strong> You must have at least 3 months of membership to create listings. You currently have {company?.membership_duration_months || 0} months.
              </p>
            </div>
          )}

          {/* Create Listing Form */}
          {showCreateListing && canCreateListings && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Create New Listing</h3>
              <form onSubmit={handleCreateListing}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newListing.title}
                    onChange={(e) =>
                      setNewListing({ ...newListing, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Enter listing title"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Category *
                  </label>
                  <select
                    value={newListing.category}
                    onChange={(e) =>
                      setNewListing({
                        ...newListing,
                        category: e.target.value as 'resource' | 'event' | 'collaboration' | 'session',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="resource">Resource</option>
                    <option value="event">Event</option>
                    <option value="collaboration">Collaboration Opportunity</option>
                    <option value="session">Knowledge Session</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newListing.description}
                    onChange={(e) =>
                      setNewListing({
                        ...newListing,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Describe your listing"
                    rows={6}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                  >
                    Create Listing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateListing(false);
                      setNewListing({ title: '', description: '', category: 'resource' });
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Listings List */}
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{listing.title}</h3>
                    <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full capitalize">
                      {listing.category.replace('-', ' ')}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {listing.description}
                  </p>

                  <div className="pt-4 border-t border-gray-100 text-xs text-gray-500">
                    <p>Created on {new Date(listing.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600 text-lg mb-2">No listings yet</p>
              {isOwner && canCreateListings && (
                <p className="text-gray-500 text-sm">
                  Click "Add Listing" to create your first listing
                </p>
              )}
              {isOwner && !canCreateListings && (
                <p className="text-gray-500 text-sm">
                  Create a listing once you reach 3 months of membership
                </p>
              )}
              {!isOwner && (
                <p className="text-gray-500 text-sm">
                  This company has not created any listings yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
