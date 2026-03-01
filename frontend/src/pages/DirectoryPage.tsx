import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import apiService from '../services/apiService';
import NavBar from '../components/NavBar';
import LoyaltyBadge from '../components/LoyaltyBadge';
import CompanyLogo from '../components/CompanyLogo';
import { Company, Filters } from '../types';

const DirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filters, setFilters] = useState<Filters>({ industries: [], sizes: [] });
  const [sortBy, setSortBy] = useState('name');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companiesData = await apiService.getAllCompanies(sortBy, selectedIndustry);
        setCompanies(companiesData);
        
        // Fetch filters
        try {
          const filtersData = await apiService.getFilters();
          setFilters(filtersData);
        } catch (err) {
          console.error('Error loading filters:', err);
          // Still continue even if filters fail
        }
      } catch (err: any) {
        console.error('Error loading directory:', err);
        setError('Failed to load directory');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sortBy, selectedIndustry]);

  const filteredCompanies = companies.filter((c) =>
    c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loyaltyStats = {
    Platinum: companies.filter((c) => c.computed_loyalty_level === 'Platinum').length,
    Gold: companies.filter((c) => c.computed_loyalty_level === 'Gold').length,
    Silver: companies.filter((c) => c.computed_loyalty_level === 'Silver').length,
    Bronze: companies.filter((c) => c.computed_loyalty_level === 'Bronze').length,
  };

  const industryStats = companies.reduce((acc: Record<string, number>, c) => {
    if (c.industry) {
      acc[c.industry] = (acc[c.industry] || 0) + 1;
    }
    return acc;
  }, {});

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
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

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gray-900">Member Directory</h1>
          <p className="text-gray-500 mt-2">Discover and connect with {companies.length} member organizations</p>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-500 text-sm font-medium">Total Members</p>
            <p className="text-3xl font-light text-gray-900 mt-2">{companies.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-500 text-sm font-medium">Platinum Tier</p>
            <p className="text-3xl font-light text-blue-600 mt-2">{loyaltyStats.Platinum}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-500 text-sm font-medium">Industries</p>
            <p className="text-3xl font-light text-gray-900 mt-2">{Object.keys(industryStats).length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-500 text-sm font-medium">Avg. Tenure</p>
            <p className="text-3xl font-light text-gray-900 mt-2">
              {Math.round(companies.reduce((a, c) => a + (c.membership_duration_months || 0), 0) / companies.length)}mo
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search companies by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              >
                <option value="name">Company Name</option>
                <option value="duration">Membership Duration</option>
                <option value="loyalty">Loyalty Level</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Industry</label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              >
                <option value="">All Industries</option>
                {filters.industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setSortBy('name');
                  setSelectedIndustry('');
                  setSearchQuery('');
                }}
                className="px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors flex-1"
              >
                Reset
              </button>
            </div>

            <div className="flex items-end justify-end gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
          </div>

          {/* Results count */}
          <p className="text-gray-500 text-sm">
            Showing {filteredCompanies.length} of {companies.length} companies
          </p>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedCompany(company)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <CompanyLogo
                      companyName={company.company_name}
                      logoUrl={company.logo_url}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-emerald-700 transition-colors truncate">
                        {company.company_name}
                      </h3>
                      <div className="mt-2">
                        <LoyaltyBadge level={company.computed_loyalty_level || 'Bronze'} />
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 text-sm line-clamp-2 leading-relaxed h-10">
                    {company.description || 'No description available'}
                  </p>

                  <div className="space-y-2.5 text-sm border-t border-gray-100 pt-4">
                    {company.industry && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Industry</span>
                        <span className="text-gray-900 font-medium text-right">{company.industry}</span>
                      </div>
                    )}
                    {company.membership_duration_months !== null && company.membership_duration_months !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tenure</span>
                        <span className="text-gray-900 font-medium">{company.membership_duration_months}mo</span>
                      </div>
                    )}
                  </div>

                  <button className="w-full mt-4 px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-3 mb-8">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 cursor-pointer p-6"
                onClick={() => setSelectedCompany(company)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 flex items-start gap-3">
                    <CompanyLogo
                      companyName={company.company_name}
                      logoUrl={company.logo_url}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{company.company_name}</h3>
                        <LoyaltyBadge level={company.computed_loyalty_level || 'Bronze'} />
                      </div>
                    <p className="text-gray-600 text-sm mb-3">{company.description || 'No description available'}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {company.industry && (
                        <div>
                          <span className="text-gray-500">Industry:</span>
                          <span className="ml-2 font-medium text-gray-900">{company.industry}</span>
                        </div>
                      )}
                      {company.size && (
                        <div>
                          <span className="text-gray-500">Size:</span>
                          <span className="ml-2 font-medium text-gray-900 capitalize">{company.size}</span>
                        </div>
                      )}
                      {company.membership_duration_months !== null && company.membership_duration_months !== undefined && (
                        <div>
                          <span className="text-gray-500">Member for:</span>
                          <span className="ml-2 font-medium text-gray-900">{company.membership_duration_months} months</span>
                        </div>
                      )}
                      {company.membership_start_date && (
                        <div>
                          <span className="text-gray-500">Since:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {new Date(company.membership_start_date).toLocaleDateString('en-US', {
                              month: 'short',
                              year: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                  <button className="ml-4 px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors whitespace-nowrap">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-2">No companies found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Quick View Modal */}
        {selectedCompany && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CompanyLogo
                    companyName={selectedCompany.company_name}
                    logoUrl={selectedCompany.logo_url}
                    size="lg"
                  />
                  <h2 className="text-2xl font-light text-gray-900 truncate">{selectedCompany.company_name}</h2>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <LoyaltyBadge level={selectedCompany.computed_loyalty_level || 'Bronze'} className="mb-4 inline-block" />
                  <p className="text-gray-600 leading-relaxed">{selectedCompany.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 py-6 border-y border-gray-200">
                  {selectedCompany.industry && (
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">Industry</p>
                      <p className="text-lg font-medium text-gray-900">{selectedCompany.industry}</p>
                    </div>
                  )}
                  {selectedCompany.size && (
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">Organization Size</p>
                      <p className="text-lg font-medium text-gray-900 capitalize">{selectedCompany.size}</p>
                    </div>
                  )}
                  {selectedCompany.membership_start_date && (
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">Member Since</p>
                      <p className="text-lg font-medium text-gray-900">
                        {new Date(selectedCompany.membership_start_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedCompany.membership_duration_months !== null && selectedCompany.membership_duration_months !== undefined && (
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">Membership Duration</p>
                      <p className="text-lg font-medium text-gray-900">{selectedCompany.membership_duration_months} months</p>
                    </div>
                  )}
                </div>

                {selectedCompany.website && (
                  <div className="pt-6">
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Visit Website →
                    </a>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => navigate(`/company/${selectedCompany.id}`)}
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    Full Profile
                  </button>
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryPage;
