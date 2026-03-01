import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import apiService from '../services/apiService';
import { getRecommendedListings, RecommendedListingWithReason } from '../services/geminiRecommendationService';
import { getRecommendationsCacheKey } from '../services/recommendationsCache';
import NavBar from '../components/NavBar';
import LoyaltyBadge from '../components/LoyaltyBadge';
import CompanyLogo from '../components/CompanyLogo';

function getRequestSignature(requestIds: string[]): string {
  return [...requestIds].sort().join(',');
}

const RecommendedListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedListingWithReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user?.company_id) {
        setLoading(false);
        setRecommendations([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [company, requests, companyListings, allListings] = await Promise.all([
          apiService.getCompanyById(user.company_id),
          apiService.getRequestsByCompany(user.company_id),
          apiService.getListingsByCompany(user.company_id),
          apiService.getAllListings(),
        ]);

        if (cancelled) return;

        const signature = getRequestSignature(requests.map((r) => r.id));
        const cacheKey = getRecommendationsCacheKey(user.company_id);
        const cachedRaw = sessionStorage.getItem(cacheKey);
        let cached: { signature: string; data: RecommendedListingWithReason[] } | null = null;
        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw);
            if (parsed?.signature && Array.isArray(parsed.data)) {
              cached = { signature: parsed.signature, data: parsed.data };
            }
          } catch {
            // ignore invalid cache
          }
        }

        if (cached && cached.signature === signature) {
          setRecommendations(cached.data);
          setLoading(false);
          return;
        }

        const result = await getRecommendedListings(
          company ?? null,
          requests,
          companyListings,
          allListings
        );
        if (cancelled) return;
        setRecommendations(result);
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ signature, data: result })
          );
        } catch {
          // ignore quota errors
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load recommendations');
          setRecommendations([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.company_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar
          currentPage="recommendedListings"
          onLogout={() => {
            logout();
            navigate('/login');
          }}
        />
        <div className="max-w-7xl mx-auto px-6 py-12 flex items-center justify-center">
          <p className="text-gray-500">Loading recommendations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        currentPage="recommendedListings"
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gray-900">Recommended Listings</h1>
          <p className="text-gray-500 mt-2">
            Based on your requests (service type) and your company’s industry and services.
          </p>
          <a
            href="/dashboard"
            className="inline-block mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Add or edit requests on Dashboard →
          </a>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {!error && recommendations.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">
              No recommendations yet. Add a request on your Dashboard (service type you’re looking for) to get personalized listings, or check back later.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {!error && recommendations.length > 0 && (
          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-2">Recommended for you</h2>
            <p className="text-gray-500 text-sm mb-6">
              Matched to your requests and company profile (industry and services).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map(({ listing, reason }) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 p-6"
                >
                  <div className="flex gap-2 items-center mb-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-800 rounded capitalize">
                      {listing.category}
                    </span>
                    {listing.company_loyalty_level && (
                      <LoyaltyBadge level={listing.company_loyalty_level} className="text-xs" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{listing.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{listing.description}</p>
                  <p className="text-xs text-emerald-600 font-medium mb-1">Why recommended</p>
                  <p className="text-gray-500 text-sm italic mb-4">{reason}</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <CompanyLogo
                        companyName={listing.company_name ?? 'Company'}
                        logoUrl={listing.company_logo_url}
                        size="sm"
                      />
                      <span className="text-sm text-gray-500 truncate">
                        {listing.company_name ?? 'Company'}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate('/listings')}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      View in Listings →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default RecommendedListingsPage;
