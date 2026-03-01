import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginByCompanyName, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form
  const [loginData, setLoginData] = useState({
    company_name: '',
    password: '',
  });

  // Register form
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    company_name: '',
    industry: '',
    size: 'small',
    website: '',
    description: '',
    cic_join_date: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginByCompanyName(loginData.company_name, loginData.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(
        registerData.email,
        registerData.password,
        registerData.company_name,
        registerData.industry,
        registerData.size,
        registerData.website,
        registerData.description,
        registerData.cic_join_date
      );
      setError('');
      setIsRegister(false);
      setLoginData({ company_name: '', password: '' });
      setRegisterData({
        email: '',
        password: '',
        company_name: '',
        industry: '',
        size: 'small',
        website: '',
        description: '',
        cic_join_date: '',
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-md w-full">
        <div className="border-b border-gray-200 p-8 text-center">
          <h1 className="text-3xl font-light text-gray-900">Circular Innovation</h1>
          <p className="text-gray-500 text-sm mt-2">Member Network</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {!isRegister ? (
            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={loginData.company_name}
                  onChange={(e) =>
                    setLoginData({ ...loginData, company_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  placeholder="Enter your company name"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-400 transition-colors text-sm"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <p className="mt-6 text-center text-gray-600 text-sm">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError('');
                  }}
                  className="text-emerald-600 font-medium hover:text-emerald-700"
                >
                  Register
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      password: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                  required
                  minLength={6}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={registerData.company_name}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      company_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Industry
                </label>
                <select
                  value={registerData.industry}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      industry: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                  required
                >
                  <option value="">Select an industry</option>
                  <option value="Business Services">Business Services</option>
                  <option value="Consulting / Engineering">Consulting / Engineering</option>
                  <option value="Education">Education</option>
                  <option value="Government">Government</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Non-Profit / Association">Non-Profit / Association</option>
                  <option value="Packaging / Reuse">Packaging / Reuse</option>
                  <option value="Retail">Retail</option>
                  <option value="Technology">Technology</option>
                  <option value="Waste Management">Waste Management</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Company Size
                </label>
                <select
                  value={registerData.size}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, size: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                >
                  <option value="startup">Startup</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={registerData.website}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, website: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  CIC Join Date
                </label>
                <input
                  type="date"
                  value={registerData.cic_join_date}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      cic_join_date: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                  required
                />
                <p className="text-gray-500 text-xs mt-1">The date your company joined Circular Innovation Community</p>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Description
                </label>
                <textarea
                  value={registerData.description}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>

              <p className="mt-4 text-center text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError('');
                  }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
