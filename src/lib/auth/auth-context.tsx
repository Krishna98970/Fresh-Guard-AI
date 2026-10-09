'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { INITIAL_USERS } from '@/lib/db/seed-data';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsRole: (role: UserRole) => void;
  signup: (name: string, email: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'freshguard_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Default to Admin persona for immediate productive evaluation
        setUser(INITIAL_USERS[0]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS[0]));
      }
    } catch {
      setUser(INITIAL_USERS[0]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUser = (u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    // Simulate brief network authentication
    await new Promise((r) => setTimeout(r, 400));
    const matched = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      saveUser(matched);
      setIsLoading(false);
      return { success: true };
    }

    // Allow any other valid email as Manager
    const newUser: User = {
      id: `usr-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: 'MANAGER',
      organizationId: 'org-freshguard-01',
      department: 'Operations',
      createdAt: new Date().toISOString(),
    };
    saveUser(newUser);
    setIsLoading(false);
    return { success: true };
  };

  const loginAsRole = (targetRole: UserRole) => {
    const persona = INITIAL_USERS.find((u) => u.role === targetRole) || {
      ...INITIAL_USERS[0],
      id: `usr-${targetRole.toLowerCase()}`,
      role: targetRole,
      name: `${targetRole.replace('_', ' ')} Specialist`,
    };
    saveUser(persona);
  };

  const signup = async (
    name: string,
    email: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      organizationId: 'org-freshguard-01',
      department: 'Intake Logistics',
      createdAt: new Date().toISOString(),
    };
    saveUser(newUser);
    setIsLoading(false);
    return { success: true };
  };

  const logout = () => {
    saveUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    saveUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'VIEWER',
        isAuthenticated: !!user,
        isLoading,
        login,
        loginAsRole,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
