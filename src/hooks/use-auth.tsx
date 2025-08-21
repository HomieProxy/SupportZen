"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin, logout as apiLogout } from '@/lib/auth';

interface User {
  email: string;
  token: string;
  auth_data: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for a token in localStorage to maintain session
    try {
        const storedUser = localStorage.getItem('supportzen_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    } catch (error) {
        console.error("Failed to parse user from local storage", error);
        localStorage.removeItem('supportzen_user');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userData = await apiLogin(email, password);
      setUser(userData);
      localStorage.setItem('supportzen_user', JSON.stringify(userData));
      router.push('/');
    } catch (error) {
      // Clear any stale user data
      localStorage.removeItem('supportzen_user');
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    localStorage.removeItem('supportzen_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
