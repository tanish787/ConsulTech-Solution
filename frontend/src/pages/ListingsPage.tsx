import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getListings, createListing, updateListing, deleteListing } from '../api/listings';
import ListingCard from '../components/ListingCard';
import Navbar from '../components/Navbar';

const CATEGORIES = ['resource', 'event', 'session', 'collaboration'];

const ListingsPage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingListing, setEditingListing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'event' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canCreate = user?.company?.privileges?.includes('create_listings');

  const fetchListings = useCallback(() => {
    setLoading(true);
    const params: any = {};
    if (category) params.category = category;
    getListings(params)
      .then(res => setListings(res.data))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createListing(form);
      setForm({ title: '', description: '', category: 'event' });
      setShowCreate(false);
      fetchListings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;
    setSaving(true);
    setError('');
    try {
      await updateListing(editingListing.id, {
        title: editingListing.title,
        description: editingListing.description,
        category: editingListing.category,
      });
      setEditingListing(null);
      fetchListings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this listing?')) return;
    await deleteListing(id);
    fetchListings();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              + Create Listing
            </button>
          )}
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['', ...CATEGORIES].map(cat => (
            <button
              key={cat || 'all'}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat ? 'bg-teal-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'All'}
            </button>
          ))}
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Create Listing</h2>
              {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={saving} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                    {saving ? 'Creating...' : 'Create'}
                  </button>
                  <button type="button" onClick={() => setShowCreate(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingListing && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Edit Listing</h2>
              {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
              <form onSubmit={handleEdit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={editingListing.title}
                    onChange={e => setEditingListing((l: any) => ({ ...l, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={editingListing.description || ''}
                    onChange={e => setEditingListing((l: any) => ({ ...l, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={editingListing.category}
                    onChange={e => setEditingListing((l: any) => ({ ...l, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={saving} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setEditingListing(null)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No listings found</div>
        ) : (
          <div className="space-y-4">
            {listings.map(l => (
              <ListingCard
                key={l.id}
                listing={l}
                currentCompanyId={user?.companyId}
                onEdit={canCreate ? setEditingListing : undefined}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingsPage;
