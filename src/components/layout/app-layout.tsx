'use client';

import { Header } from './header';
import { Sidebar } from './sidebar';
import { ProtectedRoute } from './protected-route';

interface AppLayoutProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function AppLayout({ children, adminOnly = false }: AppLayoutProps) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <div className="flex-shrink-0 p-4">
            <Sidebar />
          </div>
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
