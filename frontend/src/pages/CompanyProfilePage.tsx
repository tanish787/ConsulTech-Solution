import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCompany, updateCompany } from '../api/companies';
import LoyaltyBadge from '../components/LoyaltyBadge';
import ListingCard from '../components/ListingCard';
import Navbar from '../components/Navbar';

const INDUSTRIES = ['Technology', 'Environment', 'Manufacturing', 'Administration', 'Finance', 'Healthcare', 'Education', 'Other'];
const SIZES = [
  { value: 'startup', label: 'Startup' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const CompanyProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isOwn = user?.companyId === Number(id);

  useEffect(() => {
    if (id) {
      getCompany(Number(id)).then(res => {
        setCompany(res.data);
        setEditForm({
          company_name: res.data.company_name,
          description: res.data.description || '',
          industry: res.data.industry || '',
          size: res.data.size || '',
          website: res.data.website || '',
        });
      });
    }
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await updateCompany(Number(id), editForm);
      setCompany((prev: any) => ({ ...prev, ...res.data }));
      setEditing(false);
      await refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!company) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="text-center py-12 text-gray-400">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <h2 className="font-semibold text-gray-700 text-lg mb-4">Edit Profile</h2>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editForm.company_name}
                  onChange={e => setEditForm((f: any) => ({ ...f, company_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editForm.description}
                  onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={editForm.industry}
                    onChange={e => setEditForm((f: any) => ({ ...f, industry: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={editForm.size}
                    onChange={e => setEditForm((f: any) => ({ ...f, size: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={editForm.website}
                  onChange={e => setEditForm((f: any) => ({ ...f, website: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{company.company_name}</h1>
                  <div className="flex items-center gap-3 mb-3">
                    <LoyaltyBadge level={company.level} />
                    {company.duration && <span className="text-sm text-gray-500">Member for {company.duration}</span>}
                  </div>
                  {company.industry && <p className="text-sm text-teal-600 font-medium mb-2">{company.industry} · {company.size}</p>}
                  {company.description && <p className="text-gray-600 text-sm">{company.description}</p>}
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 text-sm hover:underline mt-2 inline-block">
                      {company.website}
                    </a>
                  )}
                </div>
                {isOwn && (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-teal-50 hover:bg-teal-100 text-teal-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Privileges</h3>
                <div className="flex flex-wrap gap-2">
                  {company.privileges?.map((p: string) => (
                    <span key={p} className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded-full capitalize">{p.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {company.listings && company.listings.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-4">Listings</h2>
            <div className="space-y-3">
              {company.listings.map((l: any) => (
                <ListingCard key={l.id} listing={{ ...l, company_name: company.company_name }} loyaltyLevel={company.level} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfilePage;
