import { Company, Listing, CompanyRequest } from '../types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_MODEL = 'google/gemini-2.5-flash';

export interface RecommendedListingWithReason {
  listing: Listing;
  reason: string;
}

function getApiKey(): string {
  const key = process.env.REACT_APP_GEMINI_API_KEY;
  if (!key) throw new Error('REACT_APP_GEMINI_API_KEY is not set in .env');
  return key;
}

/**
 * Build prompt for Gemini: recommend listings based on
 * - Company's requests (service types they're looking for = request categories)
 * - Company profile: industry, description, and services they provide (their listing categories)
 */
function buildPrompt(
  company: Company | null,
  requests: CompanyRequest[],
  companyListingCategories: string[],
  listings: Listing[]
): string {
  const requestedServiceTypes = [...new Set(requests.map((r) => r.category))].filter(Boolean);
  const serviceTypesWant =
    requestedServiceTypes.length > 0
      ? requestedServiceTypes.join(', ')
      : 'any (no requests yet — use company industry and profile)';

  const companyContext = company
    ? `The user's company: "${company.company_name}", industry: ${company.industry}, description: ${company.description || 'N/A'}. Services their company provides (listing categories they offer): ${companyListingCategories.length > 0 ? companyListingCategories.join(', ') : 'none yet'}.`
    : 'The user has no company profile.';

  const listingLines = listings
    .slice(0, 80)
    .map(
      (l) =>
        `- id="${l.id}" | title="${l.title}" | category=${l.category} | company="${l.company_name || 'Unknown'}" | description: ${(l.description || '').slice(0, 120)}`
    )
    .join('\n');

  return `You are a recommendation engine for a circular economy / sustainability member network.

${companyContext}

What the user is looking for (from their requests — service types): ${serviceTypesWant}

Available listings (use the exact "id" to refer to each):
${listingLines}

Task: Pick the best 3 to 6 listings that match the requested service type(s) and/or the company's industry and profile. Exclude listings from the user's own company (company_id or company_name matching the user's company).

Respond with a JSON array only, no other text. Each element: { "id": "<listing id>", "reason": "<one short sentence why this is recommended>" }. Example:
[{"id":"abc123","reason":"Matches your interest in events and your industry."},{"id":"def456","reason":"Collaboration opportunity aligned with your profile."}]`;
}

function parseResponse(text: string): { id: string; reason: string }[] {
  const trimmed = text.trim();
  const jsonStr = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  try {
    const arr = JSON.parse(jsonStr);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((item: unknown): item is { id: string; reason: string } =>
        typeof item === 'object' && item !== null && typeof (item as any).id === 'string' && typeof (item as any).reason === 'string'
      )
      .map((item) => ({ id: item.id, reason: item.reason }));
  } catch {
    return [];
  }
}

/**
 * Get recommended listings from Gemini using the company's requests (service type) and company profile (industry, services they provide).
 */
export async function getRecommendedListings(
  company: Company | null,
  requests: CompanyRequest[],
  companyListings: Listing[],
  allListings: Listing[]
): Promise<RecommendedListingWithReason[]> {
  if (allListings.length === 0) return [];

  const companyListingCategories = [...new Set(companyListings.map((l) => l.category))];
  const prompt = buildPrompt(company, requests, companyListingCategories, allListings);
  const apiKey = getApiKey();

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Recommendation API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Invalid response from recommendation API');

  const parsed = parseResponse(content);
  const byId = new Map(allListings.map((l) => [l.id, l]));

  const result: RecommendedListingWithReason[] = [];
  for (const { id, reason } of parsed) {
    const listing = byId.get(id);
    if (listing) result.push({ listing, reason });
  }
  return result;
}
