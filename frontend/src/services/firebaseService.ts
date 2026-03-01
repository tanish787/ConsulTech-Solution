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
    
    // Build a map of owner_name to company info from both collections
    const ownerNameMap = new Map<string, any>();
    
    // Check circular_members
    const circularSnapshot = await getDocs(collection(db, 'circular_members'));
    circularSnapshot.docs.forEach((doc) => {
      const company = doc.data();
      if (company.company_name) {
        ownerNameMap.set(company.company_name, { 
          id: doc.id, 
          ...company,
          source: 'circular_members'
        });
      }
    });
    
    // Check new_members_info (might have additional companies not yet in circular_members)
    const newMembersSnapshot = await getDocs(collection(db, 'new_members_info'));
    newMembersSnapshot.docs.forEach((doc) => {
      const member = doc.data();
      if (member.company_name && !ownerNameMap.has(member.company_name)) {
        ownerNameMap.set(member.company_name, { 
          id: doc.id, 
          ...member,
          source: 'new_members_info'
        });
      }
    });
    
    // Process listings
    const enrichedListings = snapshot.docs.map((doc) => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to ISO string if needed
      let created_at = data.created_at;
      if (created_at && typeof created_at === 'object' && 'toDate' in created_at) {
        created_at = (created_at as any).toDate().toISOString();
      } else if (!created_at) {
        created_at = new Date().toISOString();
      }
      
      // Map listing_type to category if category doesn't exist
      const category = data.category || data.listing_type || 'resource';
      
      const ownerName = data.owner_name || 'Unknown Company';
      
      // Map Firebase schema to Listing type
      const listing: Listing = {
        id: doc.id,
        company_id: '',
        title: data.short_description || data.title || `${data.material_or_need || category}`,
        description: data.full_description || '',
        category,
        created_at,
        updated_at: created_at,
        company_name: ownerName,
        company_logo_url: undefined,
        company_loyalty_level: undefined,
      };
      
      // Try to enrich with company info from ownerNameMap
      if (ownerNameMap.has(ownerName)) {
        const companyInfo = ownerNameMap.get(ownerName);
        listing.company_id = companyInfo.id;
        listing.company_logo_url = companyInfo.logo_url;
        listing.company_loyalty_level = companyInfo.computed_loyalty_level;
        console.log(`✅ Found company info for listing "${listing.title}" - owner: ${ownerName} (source: ${companyInfo.source})`);
      } else {
        console.warn(`⚠️ No company info found for listing "${listing.title}" - owner: ${ownerName}`);
      }
      
      return listing;
    });
    
    return enrichedListings;
  } catch (error) {
    console.error('Error fetching all listings:', error);
    throw error;
  }
};

export const getListingsByCompany = async (companyId: string): Promise<Listing[]> => {
  try {
    const listingsRef = collection(db, 'listings');
    const snapshot = await getDocs(listingsRef);
    
    // Get company data to filter by owner name
    const company = await getCompanyById(companyId);
    if (!company) {
      return [];
    }
    
    const companyName = company.company_name;
    
    // Filter listings by owner_name matching the company name
    const listings = snapshot.docs
      .filter((doc) => {
        const data = doc.data();
        return data.owner_name === companyName;
      })
      .map((doc) => {
        const data = doc.data();
        
        // Convert Firestore Timestamp to ISO string if needed
        let created_at = data.created_at;
        if (created_at && typeof created_at === 'object' && 'toDate' in created_at) {
          created_at = (created_at as any).toDate().toISOString();
        } else if (!created_at) {
          created_at = new Date().toISOString();
        }
        
        // Map listing_type to category if category doesn't exist
        const category = data.category || data.listing_type || 'resource';
        
        // Map Firebase schema to Listing type
        const listing: Listing = {
          id: doc.id,
          company_id: companyId,
          title: data.short_description || data.title || `${data.material_or_need || category}`,
          description: data.full_description || '',
          category,
          created_at,
          updated_at: created_at,
          company_name: companyName,
          company_logo_url: company.logo_url,
          company_loyalty_level: company.computed_loyalty_level,
        };
        
        return listing;
      });
    
    return listings;
  } catch (error) {
    console.error('Error fetching listings for company:', error);
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

export const getCompanyEmailByName = async (companyName: string): Promise<string | null> => {
  try {
    // Search in circular_members first
    const circularRef = collection(db, 'circular_members');
    const circularQuery = query(circularRef, where('company_name', '==', companyName));
    const circularSnapshot = await getDocs(circularQuery);
    
    if (circularSnapshot.docs.length > 0) {
      const company = circularSnapshot.docs[0].data();
      if (company.email) {
        return company.email;
      }
    }
    
    // If not found in circular_members, search in new_members_info
    const newMembersRef = collection(db, 'new_members_info');
    const newMembersQuery = query(newMembersRef, where('company_name', '==', companyName));
    const newMembersSnapshot = await getDocs(newMembersQuery);
    
    if (newMembersSnapshot.docs.length > 0) {
      const member = newMembersSnapshot.docs[0].data();
      if (member.email) {
        return member.email;
      }
    }
    
    console.warn(`No email found for company: ${companyName}`);
    return null;
  } catch (error) {
    console.error('Error fetching company email:', error);
    throw error;
  }
};

export const getCompanyContactInfo = async (companyName: string): Promise<{ email: string | null; website: string | null }> => {
  try {
    // Search in circular_members first
    const circularRef = collection(db, 'circular_members');
    const circularQuery = query(circularRef, where('company_name', '==', companyName));
    const circularSnapshot = await getDocs(circularQuery);
    
    if (circularSnapshot.docs.length > 0) {
      const company = circularSnapshot.docs[0].data();
      return {
        email: company.email || null,
        website: company.website || null,
      };
    }
    
    // If not found in circular_members, search in new_members_info
    const newMembersRef = collection(db, 'new_members_info');
    const newMembersQuery = query(newMembersRef, where('company_name', '==', companyName));
    const newMembersSnapshot = await getDocs(newMembersQuery);
    
    if (newMembersSnapshot.docs.length > 0) {
      const member = newMembersSnapshot.docs[0].data();
      return {
        email: member.email || null,
        website: member.website || null,
      };
    }
    
    console.warn(`No contact info found for company: ${companyName}`);
    return { email: null, website: null };
  } catch (error) {
    console.error('Error fetching company contact info:', error);
    throw error;
  }
};