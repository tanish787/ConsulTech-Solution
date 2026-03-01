const CACHE_KEY_PREFIX = 'cic_recommendations_cache_';

export function getRecommendationsCacheKey(companyId: string): string {
  return `${CACHE_KEY_PREFIX}${companyId}`;
}

/** Call when requests are added or deleted so Recommended Listings refetches next time. */
export function invalidateRecommendationsCache(companyId: string): void {
  try {
    sessionStorage.removeItem(getRecommendationsCacheKey(companyId));
  } catch {
    // ignore
  }
}
