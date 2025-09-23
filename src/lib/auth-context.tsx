'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, isConfigured } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { AUTH_CONFIG } from '@/lib/auth-config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userRole: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Admin checking function - you can customize this logic
  const checkAdminStatus = (user: User | null): { isAdmin: boolean; userRole: string } => {
    if (!user) return { isAdmin: false, userRole: 'guest' };
    
    // Check if user email is in admin list
    const adminEmails = [
      'admin@example.com',
      'trindt.dev@gmail.com', // Add your admin email here
      'manager@phonestore.com',
      'nneenterpriseinc@gmail.com',
    ];
    
    const isAdmin = adminEmails.includes(user.email || '');
    
    // You can also check custom claims if set up in Firebase
    // const customClaims = await user.getIdTokenResult();
    // const isAdmin = customClaims.claims.admin === true;
    
    return {
      isAdmin,
      userRole: isAdmin ? 'admin' : 'user'
    };
  };

  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout;
    
    if (!isConfigured) {
      console.warn('Firebase is not configured properly. Check your environment variables.');
      setLoading(false);
      
      // Delay redirect to prevent immediate redirects on page load
      redirectTimeout = setTimeout(() => {
        window.location.href = AUTH_CONFIG.getLoginUrl();
      }, 2000);
      
      return () => clearTimeout(redirectTimeout);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User authenticated' : 'No user');
      setUser(user);
      setLoading(false);
      
      // Note: We don't automatically redirect here anymore
      // Let individual pages handle their own auth requirements
    });

    return () => unsubscribe();
  }, [router]);

  const logout = async () => {
    try {
      await signOut(auth);
      // Redirect to login app after logout
      window.location.href = AUTH_CONFIG.getLoginUrl();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const { isAdmin, userRole } = checkAdminStatus(user);

  const value = {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
    isAdmin,
    userRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protecting routes
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login app if not authenticated
      window.location.href = AUTH_CONFIG.getLoginUrl();
    }
  }, [user, loading, router]);

  return { user, loading };
}