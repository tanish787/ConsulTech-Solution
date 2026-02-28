import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import apiService from '../services/apiService';
import NavBar from '../components/NavBar';
import LoyaltyBadge from '../components/LoyaltyBadge';
import { Company } from '../types';

const CompanyProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editData, setEditData] = useState<Partial<Company>>({});

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
              <LoyaltyBadge level={company.computed_loyalty_level || 'Explorer'} />
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
                  {company.computed_loyalty_level}
                </p>
                {company.months_until_next_level !== null &&
                  company.next_level && (
                    <p className="text-sm text-gray-500">
                      {company.months_until_next_level} months until{' '}
                      {company.next_level}
                    </p>
                  )}
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
      </div>
    </div>
  );
};

export default CompanyProfilePage;
