'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Users,
  PiggyBank,
  TrendingUp,
  Settings,
  AlertTriangle,
  Activity,
  DollarSign,
  UserCheck,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { apiGetUsers, apiGetAnlagen, apiGetTransaktionen } from '@/lib/api-storage';
import { User, FestgeldAnlage, Transaktion } from '@/lib/types';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [anlagen, setAnlagen] = useState<FestgeldAnlage[]>([]);
  const [transaktionen, setTransaktionen] = useState<Transaktion[]>([]);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [usersData, anlagenData, transaktionenData] = await Promise.all([
          apiGetUsers(),
          apiGetAnlagen(),
          apiGetTransaktionen()
        ]);
        setUsers(usersData);
        setAnlagen(anlagenData);
        setTransaktionen(transaktionenData);
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };
    loadAdminData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  // Calculate statistics
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const totalInvestments = anlagen.reduce((sum, a) => sum + a.betrag, 0);
  const activeInvestments = anlagen.filter(a => a.status === 'aktiv').length;
  const totalTransactions = transaktionen.length;
  const totalVolume = transaktionen
    .filter(t => t.typ === 'einzahlung')
    .reduce((sum, t) => sum + t.betrag, 0);

  // Recent activities
  const recentUsers = users
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentAnlagen = anlagen
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <AppLayout adminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Systemübersicht und Verwaltung</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/benutzer">
                <Users className="h-4 w-4 mr-2" />
                Benutzer verwalten
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/anlagen">
                <PiggyBank className="h-4 w-4 mr-2" />
                Anlagen verwalten
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gesamte Benutzer</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                  <p className="text-xs text-gray-500">{adminUsers} Admins</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aktive Anlagen</p>
                  <p className="text-2xl font-bold">{activeInvestments}</p>
                  <p className="text-xs text-gray-500">von {anlagen.length} gesamt</p>
                </div>
                <PiggyBank className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gesamtvolumen</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalInvestments)}</p>
                  <p className="text-xs text-gray-500">Investiert</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transaktionen</p>
                  <p className="text-2xl font-bold">{totalTransactions}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(totalVolume)} Volumen</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Neueste Benutzer
                </CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/benutzer">Alle anzeigen</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <p className="text-gray-600 text-center py-4">Keine Benutzer vorhanden</p>
              ) : (
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.name}</p>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Erstellt: {formatDate(user.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/benutzer/${user.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Investments */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Neueste Anlagen
                </CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/anlagen">Alle anzeigen</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentAnlagen.length === 0 ? (
                <p className="text-gray-600 text-center py-4">Keine Anlagen vorhanden</p>
              ) : (
                <div className="space-y-4">
                  {recentAnlagen.map((anlage) => (
                    <div key={anlage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">Anlage #{anlage.id}</p>
                          <Badge
                            className={
                              anlage.status === 'aktiv' ? 'bg-green-500' :
                              anlage.status === 'beendet' ? 'bg-gray-500' :
                              'bg-yellow-500'
                            }
                          >
                            {anlage.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(anlage.betrag)} • {anlage.zinssatz}% • {anlage.laufzeit_monate} Monate
                        </p>
                        <p className="text-xs text-gray-500">
                          Benutzer ID: {anlage.user_id} • {formatDate(anlage.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/anlagen/${anlage.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              System-Benachrichtigungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Demo-Modus aktiv</p>
                  <p className="text-sm text-yellow-700">
                    Das System läuft im Demo-Modus mit localStorage. Für Produktionsumgebung Datenbank konfigurieren.
                  </p>
                </div>
              </div>

              {activeInvestments === 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Keine aktiven Anlagen</p>
                    <p className="text-sm text-blue-700">
                      Erstellen Sie neue Festgeldanlagen für Ihre Benutzer.
                    </p>
                  </div>
                </div>
              )}

              {totalUsers < 3 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Wenige Benutzer</p>
                    <p className="text-sm text-green-700">
                      Laden Sie weitere Benutzer ein oder erstellen Sie Testkonten.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild className="h-20 flex-col gap-2">
                <Link href="/admin/benutzer/neu">
                  <Plus className="h-6 w-6" />
                  Neuen Benutzer erstellen
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/anlagen/erstellen">
                  <PiggyBank className="h-6 w-6" />
                  Neue Anlage erstellen
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/einstellungen">
                  <Settings className="h-6 w-6" />
                  Systemeinstellungen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
