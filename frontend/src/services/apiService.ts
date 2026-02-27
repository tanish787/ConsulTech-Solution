import { Company, Listing, Filters } from '../types';

// Mock data
const MOCK_COMPANIES: Company[] = [
  {
    id: 1,
    company_name: 'GreenTech Solutions',
    description: 'Leading circular economy technology provider',
    industry: 'Technology',
    size: 'medium',
    website: 'https://greentech.com',
    membership_start_date: '2023-06-15',
    loyalty_level: 'Champion',
    is_approved: true,
    created_at: '2023-06-15',
    updated_at: '2023-06-15',
    membership_duration_months: 32,
    computed_loyalty_level: 'Champion',
    next_level: null,
    months_until_next_level: null,
  },
  {
    id: 2,
    company_name: 'EcoCycle Manufacturing',
    description: 'Sustainable manufacturing and recycling solutions',
    industry: 'Manufacturing',
    size: 'large',
    website: 'https://ecocycle.com',
    membership_start_date: '2023-01-10',
    loyalty_level: 'Champion',
    is_approved: true,
    created_at: '2023-01-10',
    updated_at: '2023-01-10',
    membership_duration_months: 37,
    computed_loyalty_level: 'Champion',
    next_level: null,
    months_until_next_level: null,
  },
  {
    id: 3,
    company_name: 'ReWaste Solutions',
    description: 'Waste reduction and circular business models',
    industry: 'Waste Management',
    size: 'small',
    website: 'https://rewaste.com',
    membership_start_date: '2024-06-20',
    loyalty_level: 'Participant',
    is_approved: true,
    created_at: '2024-06-20',
    updated_at: '2024-06-20',
    membership_duration_months: 8,
    computed_loyalty_level: 'Participant',
    next_level: 'Contributor',
    months_until_next_level: 4,
  },
  {
    id: 4,
    company_name: 'Eco Consulting Group',
    description: 'Strategy and innovation consulting for circular economy',
    industry: 'Consulting',
    size: 'small',
    website: 'https://ecoconsult.com',
    membership_start_date: '2023-03-05',
    loyalty_level: 'Contributor',
    is_approved: true,
    created_at: '2023-03-05',
    updated_at: '2023-03-05',
    membership_duration_months: 35,
    computed_loyalty_level: 'Contributor',
    next_level: 'Champion',
    months_until_next_level: 1,
  },
];

const MOCK_LISTINGS: Listing[] = [
  {
    id: 1,
    company_id: 1,
    title: 'AI-Powered Waste Classification System',
    description: 'Advanced machine learning solution for sorting waste streams',
    category: 'resource',
    created_at: '2025-01-15',
    updated_at: '2025-01-15',
    company_name: 'GreenTech Solutions',
    company_loyalty_level: 'Champion',
  },
  {
    id: 2,
    company_id: 2,
    title: 'Circular Economy Workshop Series',
    description: 'Monthly workshops on implementing circular principles in your business',
    category: 'event',
    created_at: '2025-02-01',
    updated_at: '2025-02-01',
    company_name: 'EcoCycle Manufacturing',
    company_loyalty_level: 'Champion',
  },
  {
    id: 3,
    company_id: 4,
    title: 'Strategic Partnership Opportunity',
    description: 'Looking for technology partners to scale circular solutions',
    category: 'collaboration',
    created_at: '2025-02-10',
    updated_at: '2025-02-10',
    company_name: 'Eco Consulting Group',
    company_loyalty_level: 'Contributor',
  },
];

class ApiService {
  async register(data: any) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error('Registration requires backend integration');
  }

  async login(email: string, password: string) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    throw new Error('Use credentials: alice@greentech.com / password123');
  }

  async getProfile() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { id: 1, email: 'alice@greentech.com', company_id: 1, role: 'member' };
  }

  async getAllCompanies(sortBy: string = 'name', industry?: string): Promise<Company[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    let filtered = [...MOCK_COMPANIES];

    if (industry && industry !== 'All') {
      filtered = filtered.filter((c) => c.industry === industry);
    }

    if (sortBy === 'duration') {
      filtered.sort((a, b) => (b.membership_duration_months || 0) - (a.membership_duration_months || 0));
    } else if (sortBy === 'loyalty') {
      const loyaltyOrder = { Champion: 0, Contributor: 1, Participant: 2, Explorer: 3 };
      filtered.sort((a, b) => loyaltyOrder[a.computed_loyalty_level as keyof typeof loyaltyOrder] - loyaltyOrder[b.computed_loyalty_level as keyof typeof loyaltyOrder]);
    } else {
      filtered.sort((a, b) => a.company_name.localeCompare(b.company_name));
    }

    return filtered;
  }

  async getCompanyById(id: number): Promise<Company> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const company = MOCK_COMPANIES.find((c) => c.id === id);
    if (!company) throw new Error('Company not found');
    return company;
  }

  async updateCompany(id: number, data: Partial<Company>) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const company = MOCK_COMPANIES.find((c) => c.id === id);
    if (!company) throw new Error('Company not found');
    Object.assign(company, data, { updated_at: new Date().toISOString().split('T')[0] });
    return company;
  }

  async getFilters(): Promise<Filters> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      industries: ['Technology', 'Manufacturing', 'Waste Management', 'Consulting'],
      sizes: ['startup', 'small', 'medium', 'large'],
    };
  }

  async createListing(data: any): Promise<Listing> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newListing: Listing = {
      id: MOCK_LISTINGS.length + 1,
      company_id: 1,
      title: data.title,
      description: data.description,
      category: data.category,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
      company_name: 'GreenTech Solutions',
      company_loyalty_level: 'Champion',
    };
    MOCK_LISTINGS.push(newListing);
    return newListing;
  }

  async getAllListings(category?: string): Promise<Listing[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (category && category !== 'all') {
      return MOCK_LISTINGS.filter((l) => l.category === category);
    }
    return MOCK_LISTINGS;
  }

  async getListingById(id: number): Promise<Listing> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const listing = MOCK_LISTINGS.find((l) => l.id === id);
    if (!listing) throw new Error('Listing not found');
    return listing;
  }

  async getListingsByCompany(companyId: number): Promise<Listing[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_LISTINGS.filter((l) => l.company_id === companyId);
  }

  async updateListing(id: number, data: Partial<Listing>): Promise<Listing> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const listing = MOCK_LISTINGS.find((l) => l.id === id);
    if (!listing) throw new Error('Listing not found');
    Object.assign(listing, data, { updated_at: new Date().toISOString().split('T')[0] });
    return listing;
  }

  async deleteListing(id: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = MOCK_LISTINGS.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Listing not found');
    MOCK_LISTINGS.splice(index, 1);
  }
}

const apiService = new ApiService();
export default apiService;
