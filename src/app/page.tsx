'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AUTH_CONFIG } from '@/lib/auth-config';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard');
      } else {
        // User is not authenticated, redirect to login app
        window.location.href = AUTH_CONFIG.getLoginUrl();
      }
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-white text-xl font-semibold">Loading Phone Store Dashboard...</h2>
          <p className="text-gray-300 mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // This will only show briefly before redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <h2 className="text-white text-xl font-semibold">Redirecting...</h2>
      </div>
    </div>
  );
}
