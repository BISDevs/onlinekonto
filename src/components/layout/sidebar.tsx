'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  PiggyBank,
  CreditCard,
  Calculator,
  User,
  Settings,
  Users,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />
  },
  {
    href: '/anlagen',
    label: 'Meine Anlagen',
    icon: <PiggyBank className="h-4 w-4" />
  },
  {
    href: '/transaktionen',
    label: 'Transaktionen',
    icon: <CreditCard className="h-4 w-4" />
  },
  {
    href: '/zinsrechner',
    label: 'Zinsrechner',
    icon: <Calculator className="h-4 w-4" />
  },
  {
    href: '/profil',
    label: 'Profil',
    icon: <User className="h-4 w-4" />
  },
  {
    href: '/einstellungen',
    label: 'Einstellungen',
    icon: <Settings className="h-4 w-4" />
  },
  {
    href: '/admin',
    label: 'Admin-Bereich',
    icon: <Shield className="h-4 w-4" />,
    adminOnly: true
  },
  {
    href: '/admin/benutzer',
    label: 'Benutzer verwalten',
    icon: <Users className="h-4 w-4" />,
    adminOnly: true
  }
];

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const visibleNavItems = navItems.filter(item =>
    !item.adminOnly || user.role === 'admin'
  );

  return (
    <div className="w-64 space-y-4">
      <Card>
        <CardContent className="p-0">
          <nav className="space-y-1 p-2">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-10",
                      isActive
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "hover:bg-gray-100"
                    )}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.adminOnly && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </CardContent>
      </Card>

      {user.role === 'admin' && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">
              Administrator
            </h3>
            <p className="text-xs text-gray-600">
              Sie haben Administrator-Rechte und können alle Bereiche verwalten.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
