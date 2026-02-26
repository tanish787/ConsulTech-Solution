import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoyaltyBadge from './LoyaltyBadge';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-teal-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="text-xl font-bold tracking-tight">
          🌿 CIC Network
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/dashboard" className="hover:text-teal-200 transition-colors">Dashboard</Link>
          <Link to="/directory" className="hover:text-teal-200 transition-colors">Directory</Link>
          <Link to="/listings" className="hover:text-teal-200 transition-colors">Listings</Link>
          {user?.isAdmin && (
            <Link to="/admin" className="hover:text-teal-200 transition-colors">Admin</Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          {user?.company?.level && <LoyaltyBadge level={user.company.level} />}
          <span className="text-sm text-teal-200">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
