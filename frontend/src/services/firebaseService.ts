import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Company, Listing, Filters, LoyaltyLevel, CompanyRequest } from '../types';

// Utility function to calculate loyalty level based on membership duration
export const calculateLoyaltyLevel = (membershipDurationMonths: number | null | undefined): LoyaltyLevel => {
  if (membershipDurationMonths == null) return 'Bronze';
  if (membershipDurationMonths < 3) return 'Bronze';
  if (membershipDurationMonths < 12) return 'Silver';
  if (membershipDurationMonths < 24) return 'Gold';
  return 'Platinum';
};

// Companies (stored in circular_members collection)
export const getAllCompanies = async (
  sortBy: string = 'membership_duration_months',
  industry?: string
): Promise<Company[]> => {
  try {
    console.log('🔍 Fetching companies from circular_members collection...');
    const membersRef = collection(db, 'circular_members');
    
    // Build query without orderBy to avoid issues with null/missing fields
    let q;
    if (industry && industry !== '') {
      console.log(`🔍 Filtering by industry: ${industry}`);
      q = query(membersRef, where('industry', '==', industry));
    } else {
      console.log('🔍 No industry filter');
      q = query(membersRef);
    }

    const snapshot = await getDocs(q);
    console.log(`✅ Found ${snapshot.size} companies`);
    
    let companies = snapshot.docs.map((doc) => {
      const data = doc.data() as any;
      const company = {
        id: doc.id,
        ...data,
      } as Company;
      
      // Calculate computed_loyalty_level based on membership_duration_months
      if (!company.computed_loyalty_level) {
        company.computed_loyalty_level = calculateLoyaltyLevel(company.membership_duration_months);
      }
      
      return company;
    });

    console.log('📋 Companies before sorting:', companies.map(c => ({ name: c.company_name, id: c.id })));

    // Sort in JavaScript to handle null values gracefully
    companies.sort((a, b) => {
      // Map frontend sort values to field names
      let sortField = sortBy;
      if (sortBy === 'duration') {
        sortField = 'membership_duration_months';
      } else if (sortBy === 'loyalty') {
        sortField = 'computed_loyalty_level';
      }

      let aVal = a[sortField as keyof Company];
      let bVal = b[sortField as keyof Company];

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Special handling for loyalty level sorting
      if (sortField === 'computed_loyalty_level') {
        const loyaltyOrder = { 'Bronze': 0, 'Silver': 1, 'Gold': 2, 'Platinum': 3 };
        const aLevel = loyaltyOrder[aVal as LoyaltyLevel] ?? -1;
        const bLevel = loyaltyOrder[bVal as LoyaltyLevel] ?? -1;
        // Sort ascending (Bronze first, Platinum last)
        return aLevel - bLevel;
      }

      // For strings, compare case-insensitively
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal);
      }

      // For numbers, sort ascending (shortest duration first)
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      }

      return 0;
    });

    console.log('✅ Companies sorted successfully:', companies.length);
    return companies;
  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    throw error;
  }
};

export const getCompanyById = async (id: string): Promise<Company | null> => {
  try {
    const docRef = doc(db, 'circular_members', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const company = { id: docSnap.id, ...docSnap.data() } as Company;
      // Calculate computed_loyalty_level if not set
      if (!company.computed_loyalty_level) {
        company.computed_loyalty_level = calculateLoyaltyLevel(company.membership_duration_months);
      }
      return company;
    }
    return null;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
};

export const createCompany = async (data: Omit<Company, 'id'>): Promise<string> => {
  try {
    const membersRef = collection(db, 'circular_members');
    const docRef = await addDoc(membersRef, {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

export const updateCompany = async (id: string, updates: Partial<Company>): Promise<void> => {
  try {
    const docRef = doc(db, 'circular_members', id);
    await updateDoc(docRef, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

// Listings
export const getAllListings = async (): Promise<Listing[]> => {
  try {
    const listingsRef = collection(db, 'listings');
    const snapshot = await getDocs(listingsRef);
    
    // Enrich listings with company information
    const enrichedListings = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const listing = { id: doc.id, ...doc.data() } as Listing;
        
        // Fetch company info to get name and loyalty level
        if (listing.company_id) {
          try {
            const company = await getCompanyById(listing.company_id);
            if (company) {
              listing.company_name = company.company_name;
              listing.company_logo_url = company.logo_url;
              listing.company_loyalty_level = company.computed_loyalty_level;
            }
          } catch (error) {
            console.error(`Error fetching company ${listing.company_id}:`, error);
          }
        }
        
        return listing;
      })
    );
    
    return enrichedListings;
  } catch (error) {
    console.error('Error fetching all listings:', error);
    throw error;
  }
};

export const getListingsByCompany = async (companyId: string): Promise<Listing[]> => {
  try {
    const listingsRef = collection(db, 'listings');
    const q = query(listingsRef, where('company_id', '==', companyId));
    const snapshot = await getDocs(q);
    
    // Enrich listings with company information
    const enrichedListings = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const listing = { id: doc.id, ...doc.data() } as Listing;
        
        // Fetch company info to get name and loyalty level
        if (listing.company_id) {
          try {
            const company = await getCompanyById(listing.company_id);
            if (company) {
              listing.company_name = company.company_name;
              listing.company_logo_url = company.logo_url;
              listing.company_loyalty_level = company.computed_loyalty_level;
            }
          } catch (error) {
            console.error(`Error fetching company ${listing.company_id}:`, error);
          }
        }
        
        return listing;
      })
    );
    
    return enrichedListings;
  } catch (error) {
    console.error('Error fetching listings:', error);
    throw error;
  }
};

export const createListing = async (data: Omit<Listing, 'id'>): Promise<string> => {
  try {
    const listingsRef = collection(db, 'listings');
    const docRef = await addDoc(listingsRef, {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
};

export const updateListing = async (id: string, updates: Partial<Listing>): Promise<void> => {
  try {
    const docRef = doc(db, 'listings', id);
    await updateDoc(docRef, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
};

export const deleteListing = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'listings', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
};

// Filters
export const getFilters = async (): Promise<Filters> => {
  try {
    const companies = await getAllCompanies();
    const industries = Array.from(new Set(companies.map((c) => c.industry)));
    const sizes = Array.from(new Set(companies.map((c) => c.size)));

    return {
      industries: industries.sort(),
      sizes: sizes.sort(),
    };
  } catch (error) {
    console.error('Error fetching filters:', error);
    throw error;
  }
};

// Loyalty Info
export const getLoyaltyInfo = async (companyId: string) => {
  try {
    const company = await getCompanyById(companyId);
    if (!company) return null;

    return {
      current_level: company.loyalty_level,
      next_level: company.next_level,
      months_until_next_level: company.months_until_next_level,
    };
  } catch (error) {
    console.error('Error fetching loyalty info:', error);
    throw error;
  }
};
// Find email by company name from new members info
export const getEmailByCompanyName = async (companyName: string): Promise<string | null> => {
  try {
    const newMembersRef = collection(db, 'new_members_info');
    // Fetch all documents and search case-insensitively
    const q = query(newMembersRef);
    const snapshot = await getDocs(q);
    
    const lowerSearchName = companyName.toLowerCase().trim();
    console.log(`Searching for company: "${companyName}" (normalized: "${lowerSearchName}")`);
    console.log(`Available companies in database:`, snapshot.docs.map((d) => d.data().company_name));
    
    for (const doc of snapshot.docs) {
      const memberData = doc.data();
      if (memberData.company_name && memberData.company_name.toLowerCase().trim() === lowerSearchName) {
        console.log(`✓ Found email for "${companyName}": ${memberData.email}`);
        return memberData.email || null;
      }
    }
    
    console.warn(`✗ Company not found: "${companyName}"`);
    return null;
  } catch (error) {
    console.error('Error fetching email by company name:', error);
    throw error;
  }
};

// Company Requests (what companies are looking for)
export const getRequestsByCompany = async (companyId: string): Promise<CompanyRequest[]> => {
  try {
    const requestsRef = collection(db, 'company_requests');
    const q = query(requestsRef, where('company_id', '==', companyId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CompanyRequest[];
  } catch (error) {
    console.error('Error fetching company requests:', error);
    throw error;
  }
};

export const createCompanyRequest = async (data: Omit<CompanyRequest, 'id'>, userId: string): Promise<string> => {
  try {
    const requestsRef = collection(db, 'company_requests');
    const docRef = await addDoc(requestsRef, {
      ...data,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating company request:', error);
    throw error;
  }
};

export const deleteCompanyRequest = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'company_requests', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting company request:', error);
    throw error;
  }
};