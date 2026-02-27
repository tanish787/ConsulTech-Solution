import React from 'react';

interface NavBarProps {
  onLogout: () => void;
  currentPage: string;
}

const NavBar: React.FC<NavBarProps> = ({ onLogout, currentPage }) => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-12">
            <h1 className="text-xl font-semibold text-gray-900">CIC</h1>
            <div className="flex gap-1">
              <a
                href="/dashboard"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentPage === 'dashboard'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </a>
              <a
                href="/directory"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentPage === 'directory'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Directory
              </a>
              <a
                href="/listings"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentPage === 'listings'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Listings
              </a>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
