import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { getEmailByCompanyName } from './firebaseService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginByCompanyName: (companyName: string, password: string) => Promise<void>;
  register: (email: string, password: string, companyName: string, industry?: string, size?: string, website?: string, description?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        
        // Create user object
        const userData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          company_id: firebaseUser.uid, // Use UID as company_id for now
          role: 'member',
        };
        setUser(userData);
      } else {
        // User is signed out
        setToken(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log(`🔐 Firebase Auth signin for email: ${email}`);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log(`✓ Firebase Auth successful for: ${email}`);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      setUser({
        id: result.user.uid,
        email: result.user.email || '',
        company_id: result.user.uid,
        role: 'member',
      });
    } catch (error) {
      console.error('❌ Firebase Auth error:', error);
      throw error;
    }
  };

  const loginByCompanyName = async (companyName: string, password: string) => {
    try {
      console.log(`🔐 Login attempt for company: "${companyName}"`);
      
      // Find email by company name
      const email = await getEmailByCompanyName(companyName);
      if (!email) {
        throw new Error(`Company "${companyName}" not found. Please check the company name and try again.`);
      }
      
      console.log(`📧 Found email: ${email}, attempting Firebase authentication...`);
      
      // Login with the found email
      await login(email, password);
      
      console.log(`✓ Login successful for company: "${companyName}"`);
    } catch (error: any) {
      console.error('Login error:', error);
      // Provide more helpful error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('Company not found in our records');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      } else if (error.message?.includes('not found')) {
        throw error;
      }
      throw error;
    }
  };

  const register = async (email: string, password: string, companyName: string, industry: string = '', size: string = 'small', website: string = '', description: string = '') => {
    try {
      // Create Firebase user account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;

      // Create login info document in new_members_info collection
      const newMembersRef = collection(db, 'new_members_info');
      const loginData = {
        uid,
        email,
        company_name: companyName,
        industry,
        size,
        website,
        description,
        created_at: new Date().toISOString(),
      };
      
      await setDoc(doc(newMembersRef, uid), loginData);

      // Create company profile in circular_members collection
      const circularMembersRef = collection(db, 'circular_members');
      const companyProfile = {
        company_name: companyName,
        description,
        industry,
        size,
        website,
        membership_start_date: new Date().toISOString(),
        membership_duration_months: 0,
        computed_loyalty_level: 'Bronze',
        is_approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await setDoc(doc(circularMembersRef, uid), companyProfile);

      // Set user state
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      setUser({
        id: uid,
        email,
        company_id: uid,
        role: 'member',
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    loginByCompanyName,
    register,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
