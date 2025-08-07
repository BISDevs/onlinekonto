'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';

export default function Home() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Simple one-time redirect using window.location to avoid React Router loops
    if (!isLoading) {
      const redirectPath = user ? '/dashboard' : '/login';
      console.log('Home: Redirecting to', redirectPath);
      window.location.replace(redirectPath);
    }
  }, [user, isLoading]);

  // Always show loading state - component will be unmounted after redirect
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Onlinekonto</h2>
        <p className="text-gray-600">
          {isLoading ? 'Wird geladen...' : 'Weiterleitung...'}
        </p>
      </div>
    </div>
  );
}
