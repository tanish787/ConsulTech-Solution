import React, { useState, useEffect } from 'react';
import { getPendingCompanies, approveCompany, adjustMembershipDate, adminDeleteListing } from '../api/admin';
import { getCompanies } from '../api/companies';
import { getListings } from '../api/listings';
import Navbar from '../components/Navbar';

type Tab = 'pending' | 'dates' | 'listings';

const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('pending');
  const [pending, setPending] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [dates, setDates] = useState<Record<number, string>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    getPendingCompanies().then(res => setPending(res.data));
    getCompanies().then(res => setCompanies(res.data));
    getListings().then(res => setListings(res.data));
  }, []);

  const handleApprove = async (id: number) => {
    await approveCompany(id);
    setPending(p => p.filter(c => c.id !== id));
    setMessage('Company approved!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDateChange = async (companyId: number) => {
    const date = dates[companyId];
    if (!date) return;
    await adjustMembershipDate(companyId, date);
    setMessage('Date updated!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteListing = async (id: number) => {
    if (!window.confirm('Delete this listing?')) return;
    await adminDeleteListing(id);
    setListings(l => l.filter(item => item.id !== id));
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: 'Pending Companies' },
    { key: 'dates', label: 'Adjust Dates' },
    { key: 'listings', label: 'Remove Listings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm mb-4">
            {message}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-teal-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
              {t.key === 'pending' && pending.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{pending.length}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'pending' && (
          <div className="space-y-3">
            {pending.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No pending companies</div>
            ) : pending.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{c.company_name}</p>
                  <p className="text-sm text-gray-500">{c.industry} · {c.size}</p>
                  {c.description && <p className="text-xs text-gray-400 mt-1">{c.description}</p>}
                </div>
                <button
                  onClick={() => handleApprove(c.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'dates' && (
          <div className="space-y-3">
            {companies.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{c.company_name}</p>
                  <p className="text-xs text-gray-400">Current: {c.membership_start_date || 'Not set'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    value={dates[c.id] || c.membership_start_date || ''}
                    onChange={e => setDates(d => ({ ...d, [c.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => handleDateChange(c.id)}
                    className="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-700"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'listings' && (
          <div className="space-y-3">
            {listings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No listings</div>
            ) : listings.map(l => (
              <div key={l.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{l.title}</p>
                  <p className="text-sm text-gray-500">{l.company_name} · {l.category}</p>
                </div>
                <button
                  onClick={() => handleDeleteListing(l.id)}
                  className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
