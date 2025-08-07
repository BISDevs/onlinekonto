'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasCheckedAuth) {
      console.log('ProtectedRoute: Checking auth...', { user: !!user, adminOnly });
      setHasCheckedAuth(true);

      if (!user) {
        console.log('ProtectedRoute: No user, redirecting to login');
        router.replace('/login');
        return;
      }

      if (adminOnly && user.role !== 'admin') {
        console.log('ProtectedRoute: Non-admin accessing admin route, redirecting to dashboard');
        router.replace('/dashboard');
        return;
      }
    }
  }, [user, isLoading, router, adminOnly, hasCheckedAuth]);

  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Authentifizierung wird überprüft...</p>
        </div>
      </div>
    );
  }

  if (!user || (adminOnly && user.role !== 'admin')) {
    // Component will be unmounted due to redirect, so return null
    return null;
  }

  return <>{children}</>;
}
