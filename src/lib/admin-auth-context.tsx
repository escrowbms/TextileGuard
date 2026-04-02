'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  isInitializing: boolean;
  adminUser: any | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAdminAuthenticated: false,
  isInitializing: true,
  adminUser: null,
  login: async () => false,
  logout: () => { },
});

// Hardcoded for now as per request for "real" but internal creds
const ADMIN_EMAIL = 'admin@textileguard.com';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_SECRET_KEY || 'admin';

console.log('[DEBUG] Admin Key Source:', import.meta.env.VITE_ADMIN_SECRET_KEY ? 'ENV (' + ADMIN_PASSWORD.slice(0, 2) + '...)' : 'FALLBACK');

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [adminUser, setAdminUser] = useState<any | null>(null);

  useEffect(() => {
    const checkAdminSession = () => {
      const savedAdmin = localStorage.getItem('textileguard_admin_session');
      if (savedAdmin) {
        try {
          const session = JSON.parse(savedAdmin);
          // Simple expiry check (24h)
          if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
            setIsAdminAuthenticated(true);
            setAdminUser(session.user);
          } else {
            localStorage.removeItem('textileguard_admin_session');
          }
        } catch (e) {
          localStorage.removeItem('textileguard_admin_session');
        }
      }
      setIsInitializing(false);
    };

    checkAdminSession();
  }, []);

  const login = async (password: string): Promise<boolean> => {
    if (password === ADMIN_PASSWORD) {
      const adminData = {
        email: ADMIN_EMAIL,
        role: 'super_admin',
        timestamp: Date.now()
      };
      
      const session = {
        user: adminData,
        timestamp: Date.now()
      };

      localStorage.setItem('textileguard_admin_session', JSON.stringify(session));
      setIsAdminAuthenticated(true);
      setAdminUser(adminData);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('textileguard_admin_session');
    setIsAdminAuthenticated(false);
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, isInitializing, adminUser, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
