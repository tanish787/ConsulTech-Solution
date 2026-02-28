import { Company, Listing, Filters } from '../types';
import * as firebaseService from './firebaseService';

class ApiService {
  // Auth methods handled by authContext.tsx directly

  async getProfile() {
    // Profile is managed by auth context
    throw new Error('Use useAuth() hook to get user profile');
  }

  async getAllCompanies(
    sortBy: string = 'membership_duration_months',
    industry?: string
  ): Promise<Company[]> {
    return firebaseService.getAllCompanies(sortBy, industry);
  }

  async getCompanyById(id: string): Promise<Company | null> {
    return firebaseService.getCompanyById(id);
  }

  async updateCompany(id: string, data: Partial<Company>): Promise<void> {
    return firebaseService.updateCompany(id, data);
  }

  async getFilters(): Promise<Filters> {
    return firebaseService.getFilters();
  }

  async createListing(data: Omit<Listing, 'id'>): Promise<string> {
    return firebaseService.createListing(data);
  }

  async getAllListings(category?: string): Promise<Listing[]> {
    const listings = await firebaseService.getListingsByCompany('all');
    if (category && category !== 'all') {
      return listings.filter((l) => l.category === category);
    }
    return listings;
  }

  async getListingById(id: string): Promise<Listing | null> {
    // This would need to be added to firebaseService if needed
    throw new Error('getListingById not yet implemented');
  }

  async getListingsByCompany(companyId: string): Promise<Listing[]> {
    return firebaseService.getListingsByCompany(companyId);
  }

  async updateListing(id: string, data: Partial<Listing>): Promise<void> {
    return firebaseService.updateListing(id, data);
  }

  async deleteListing(id: string): Promise<void> {
    return firebaseService.deleteListing(id);
  }
}

const apiService = new ApiService();
export default apiService;
