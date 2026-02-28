import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Company, Listing, Filters } from '../types';

// Companies (stored in circular-members collection)
export const getAllCompanies = async (
  sortBy: string = 'membership_duration_months',
  industry?: string
): Promise<Company[]> => {
  try {
    const membersRef = collection(db, 'circular-members');
    let q = query(membersRef, orderBy(sortBy, 'desc'));

    if (industry) {
      q = query(membersRef, where('industry', '==', industry), orderBy(sortBy, 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Company[];
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
};

export const getCompanyById = async (id: string): Promise<Company | null> => {
  try {
    const docRef = doc(db, 'circular-members', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Company;
    }
    return null;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
};

export const createCompany = async (data: Omit<Company, 'id'>): Promise<string> => {
  try {
    const membersRef = collection(db, 'circular-members');
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
    const docRef = doc(db, 'circular-members', id);
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
export const getListingsByCompany = async (companyId: string): Promise<Listing[]> => {
  try {
    const listingsRef = collection(db, 'listings');
    const q = query(listingsRef, where('company_id', '==', companyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Listing[];
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