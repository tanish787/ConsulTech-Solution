import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as authApi from '../api/auth';

interface Company {
  id: number;
  company_name: string;
  level: string;
  badge: string;
  monthsActive: number;
  privileges: string[];
  nextLevel: string | null;
  nextLevelMessage: string | null;
  duration: string;
  membership_start_date: string;
  isApproved: boolean;
}

interface User {
  id: number;
  email: string;
  companyId: number;
  isAdmin: boolean;
  company: Company | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

async function fetchMe(token: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchMe(token).then((u) => {
        setUser(u);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  async function storeAndSetUser(token: string) {
    localStorage.setItem('token', token);
    const userData = await fetchMe(token);
    setUser(userData);
  }

  async function login(email: string, password: string) {
    const { data } = await authApi.login(email, password);
    await storeAndSetUser(data.token);
  }

  async function register(data: any) {
    const { data: res } = await authApi.register(data);
    await storeAndSetUser(res.token);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  async function refreshUser() {
    const token = localStorage.getItem('token');
    if (token) {
      const userData = await fetchMe(token);
      setUser(userData);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
