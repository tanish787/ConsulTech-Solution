import React, { useState, useEffect } from 'react';
import { getCompanies } from '../api/companies';
import CompanyCard from '../components/CompanyCard';
import Navbar from '../components/Navbar';

const INDUSTRIES = ['Technology', 'Environment', 'Manufacturing', 'Administration', 'Finance', 'Healthcare', 'Education', 'Other'];
const SIZES = [
  { value: 'startup', label: 'Startup' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const DirectoryPage: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [sort, setSort] = useState('');

  useEffect(() => {
    const params: any = {};
    if (industry) params.industry = industry;
    if (size) params.size = size;
    if (sort) params.sort = sort;

    setLoading(true);
    getCompanies(params)
      .then(res => setCompanies(res.data))
      .finally(() => setLoading(false));
  }, [industry, size, sort]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Member Directory</h1>
          <span className="text-sm text-gray-500">{companies.length} member{companies.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Industry</label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Industries</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Size</label>
            <select
              value={size}
              onChange={e => setSize(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Sizes</option>
              {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Default</option>
              <option value="name">Name</option>
              <option value="duration">Membership Duration</option>
              <option value="loyalty">Loyalty Level</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No companies found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map(c => <CompanyCard key={c.id} company={c} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryPage;
