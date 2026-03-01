import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import apiService from '../services/apiService';
import NavBar from '../components/NavBar';
import LoyaltyBadge from '../components/LoyaltyBadge';
import { Company, Listing, CompanyRequest } from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [newListing, setNewListing] = useState<{
    title: string;
    description: string;
    category: 'resource' | 'event' | 'collaboration' | 'session';
  }>({
    title: '',
    description: '',
    category: 'resource',
  });
  const [newRequest, setNewRequest] = useState<{
    title: string;
    description: string;
    category: 'resource' | 'event' | 'collaboration' | 'session' | 'partnership';
  }>({
    title: '',
    description: '',
    category: 'resource',
  });

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        if (user?.company_id) {
          console.log('Fetching company with ID:', user.company_id);
          const data = await apiService.getCompanyById(user.company_id);
          console.log('Company data:', data);
          setCompany(data);
          
          // Fetch listings for this company
          if (data) {
            const companyListings = await apiService.getListingsByCompany(data.id);
            setListings(companyListings);
            
            // Fetch requests for this company
            const companyRequests = await apiService.getRequestsByCompany(data.id);
            setRequests(companyRequests);
          }
        }
      } catch (err: any) {
        console.error('Failed to load company:', err);
        setError('Failed to load company information');
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

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteListing(listingId);
      // Refresh listings
      if (company) {
        const updatedListings = await apiService.getListingsByCompany(company.id);
        setListings(updatedListings);
      }
      setError('');
    } catch (err: any) {
      setError('Failed to delete listing');
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user) return;

    try {
      const now = new Date().toISOString();
      await apiService.createCompanyRequest({
        ...newRequest,
        company_id: company.id,
        company_name: company.company_name,
        created_at: now,
        updated_at: now,
      }, user.id);
      // Refresh requests
      const updatedRequests = await apiService.getRequestsByCompany(company.id);
      setRequests(updatedRequests);
      setNewRequest({ title: '', description: '', category: 'resource' });
      setShowCreateRequest(false);
      setError('');
    } catch (err: any) {
      setError('Failed to create request');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      await apiService.deleteCompanyRequest(requestId);
      // Refresh requests
      if (company) {
        const updatedRequests = await apiService.getRequestsByCompany(company.id);
        setRequests(updatedRequests);
      }
      setError('');
    } catch (err: any) {
      setError('Failed to delete request');
    }
  };

  // Silver tier requires 3+ months membership
  const canCreateListings = company && (company.membership_duration_months || 0) >= 3;
  const membershipTierLevel = company?.computed_loyalty_level || 'Bronze';

  const tierInfo = {
    Bronze: { description: 'Less than 3 months' },
    Silver: { description: '3–12 months' },
    Gold: { description: '12–24 months' },
    Platinum: { description: '24+ months' },
  };

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
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-2">Your organization's membership overview</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Company Overview Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h2 className="text-3xl font-light text-gray-900 mb-1">
                {company.company_name}
              </h2>
              <p className="text-gray-500">Your organization</p>
            </div>
            <LoyaltyBadge level={membershipTierLevel} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-gray-200 pt-6">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">
                Industry
              </p>
              <p className="text-lg font-medium text-gray-900">{company.industry}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">
                Organization Size
              </p>
              <p className="text-lg font-medium text-gray-900 capitalize">{company.size}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">
                Member Since
              </p>
              <p className="text-lg font-medium text-gray-900">
                {new Date(company.membership_start_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">
                Months Active
              </p>
              <p className="text-lg font-medium text-gray-900">{company.membership_duration_months}</p>
            </div>
          </div>
        </div>

        {/* Membership & Loyalty Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Current Tier */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-2xl font-light text-gray-900 mb-2">
              Current Tier
            </h3>
            <p className="text-gray-500 mb-6">{tierInfo[membershipTierLevel]?.description}</p>

            <div className="inline-flex items-center gap-3 mb-6">
              <LoyaltyBadge level={membershipTierLevel} />
              <span className="text-lg font-semibold text-gray-900">{membershipTierLevel}</span>
            </div>

            {canCreateListings ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm text-emerald-900">
                  <strong>✓ Silver+ members</strong> (3+ months) can create and manage listings. You qualify!
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  You need <strong>{3 - (company.membership_duration_months || 0)} more months</strong> to unlock listing creation at Silver tier.
                </p>
              </div>
            )}
          </div>

          {/* Upgrade Progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-2xl font-light text-gray-900 mb-4">
              Membership Progress
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm mb-2">Current membership duration</p>
                <p className="text-3xl font-light text-gray-900">{company.membership_duration_months} months</p>
              </div>
              
              {membershipTierLevel === 'Bronze' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-900">
                    <strong>{3 - (company.membership_duration_months || 0)} months</strong> until Silver tier
                  </p>
                  <p className="text-xs text-amber-700 mt-1">Unlock listing creation at Silver tier</p>
                </div>
              )}
              {membershipTierLevel === 'Silver' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">
                    <strong>{12 - (company.membership_duration_months || 0)} months</strong> until Gold tier
                  </p>
                  <p className="text-xs text-blue-700 mt-1">Exclusive benefits at Gold tier</p>
                </div>
              )}
              {membershipTierLevel === 'Gold' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-900">
                    <strong>{24 - (company.membership_duration_months || 0)} months</strong> until Platinum tier
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">Premium benefits at Platinum tier</p>
                </div>
              )}
              {membershipTierLevel === 'Platinum' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-900">
                    <strong>🏆 You've reached the highest tier!</strong>
                  </p>
                  <p className="text-xs text-purple-700 mt-1">Thank you for your commitment to the network</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Your Listings Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-light text-gray-900">Your Listings</h2>
              <p className="text-gray-500 text-sm mt-1">{listings.length} listings published</p>
            </div>
            {canCreateListings && (
              <button
                onClick={() => setShowCreateListing(!showCreateListing)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
              >
                {showCreateListing ? 'Cancel' : '+ Add Listing'}
              </button>
            )}
          </div>

          {!canCreateListings && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>Requirement:</strong> Only Silver+ members (3+ months) can create listings. You currently have {company.membership_duration_months || 0} months.
              </p>
            </div>
          )}

          {/* Create Listing Form */}
          {showCreateListing && canCreateListings && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Create New Listing</h3>
              <form onSubmit={handleCreateListing} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
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

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
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

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
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
                    rows={4}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
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

          {/* Listings Grid */}
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all p-6"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-medium text-gray-900 flex-1">
                      {listing.title}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded whitespace-nowrap capitalize">
                      {listing.category}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                    {listing.description}
                  </p>

                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <p className="text-xs text-gray-500">
                      Created on {new Date(listing.created_at).toLocaleDateString()}
                    </p>
                    
                    {canCreateListings && (
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 border-dashed p-12 text-center">
              <p className="text-gray-600 text-lg mb-2">No listings yet</p>
              {canCreateListings && (
                <p className="text-gray-500 text-sm">
                  Click "Add Listing" to create your first listing
                </p>
              )}
              {!canCreateListings && (
                <p className="text-gray-500 text-sm">
                  Create a listing once you reach Silver tier (3 months)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Company Requests Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-light text-gray-900">What We're Looking For</h2>
              <p className="text-gray-500 text-sm mt-1">{requests.length} active requests</p>
            </div>
            <button
              onClick={() => setShowCreateRequest(!showCreateRequest)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              {showCreateRequest ? 'Cancel' : '+ Add Request'}
            </button>
          </div>

          {/* Create Request Form */}
          {showCreateRequest && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Create New Request</h3>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    What are you looking for? *
                  </label>
                  <input
                    type="text"
                    value={newRequest.title}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Describe what you are looking for"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Category *
                  </label>
                  <select
                    value={newRequest.category}
                    onChange={(e) =>
                      setNewRequest({
                        ...newRequest,
                        category: e.target.value as 'resource' | 'event' | 'collaboration' | 'session' | 'partnership',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="resource">Resource/Service</option>
                    <option value="partnership">Partnership</option>
                    <option value="collaboration">Collaboration</option>
                    <option value="event">Event/Training</option>
                    <option value="session">Knowledge/Expertise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Details *
                  </label>
                  <textarea
                    value={newRequest.description}
                    onChange={(e) =>
                      setNewRequest({
                        ...newRequest,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Describe what you're looking for and why"
                    rows={4}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Post Request
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateRequest(false);
                      setNewRequest({ title: '', description: '', category: 'resource' });
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Requests Grid */}
          {requests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-6"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-medium text-gray-900 flex-1">
                      {request.title}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded whitespace-nowrap capitalize">
                      {request.category}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                    {request.description}
                  </p>

                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <p className="text-xs text-gray-500">
                      Posted on {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    
                    <button
                      onClick={() => handleDeleteRequest(request.id)}
                      className="w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 border-dashed p-12 text-center">
              <p className="text-gray-600 text-lg mb-2">No requests yet</p>
              <p className="text-gray-500 text-sm">
                Click "Add Request" to post what you're looking for
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
