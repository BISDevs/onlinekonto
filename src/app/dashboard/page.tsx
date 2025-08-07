'use client';

import { useAuth } from '@/lib/auth-context';
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
  PiggyBank,
  TrendingUp,
  Euro,
  Calendar,
  Eye,
  Plus
} from 'lucide-react';
import { apiGetAnlagenByUser, apiGetTransaktionenByUser } from '@/lib/api-storage';
import { FestgeldAnlage, Transaktion } from '@/lib/types';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [anlagen, setAnlagen] = useState<FestgeldAnlage[]>([]);
  const [transaktionen, setTransaktionen] = useState<Transaktion[]>([]);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          const [userAnlagen, userTransaktionen] = await Promise.all([
            apiGetAnlagenByUser(user.id),
            apiGetTransaktionenByUser(user.id, 5)
          ]);
          setAnlagen(userAnlagen);
          setTransaktionen(userTransaktionen);
        } catch (error) {
          console.error('Error loading dashboard data:', error);
        }
      };
      loadData();
    }
  }, [user]);

  if (!user) return null;

  const totalInvestment = anlagen.reduce((sum, anlage) => sum + anlage.betrag, 0);
  const totalInterest = anlagen.reduce((sum, anlage) => sum + anlage.zinsbetrag, 0);
  const activeAnlagen = anlagen.filter(anlage => anlage.status === 'aktiv');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktiv':
        return <Badge className="bg-green-500">Aktiv</Badge>;
      case 'beendet':
        return <Badge variant="secondary">Beendet</Badge>;
      case 'vorzeitig_beendet':
        return <Badge className="bg-yellow-500">Vorzeitig beendet</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getProgress = (anlage: FestgeldAnlage) => {
    const startDate = new Date(anlage.start_datum);
    const endDate = new Date(anlage.end_datum);
    const now = new Date();

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();

    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Willkommen zurück, {user.name}!</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gesamtanlage</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalInvestment)}</p>
                </div>
                <PiggyBank className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Erwartete Zinsen</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalInterest)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aktive Anlagen</p>
                  <p className="text-2xl font-bold">{activeAnlagen.length}</p>
                </div>
                <Euro className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gesamtanlagen</p>
                  <p className="text-2xl font-bold">{anlagen.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fixed Deposits Overview */}
        <Card>
          <CardHeader className="bg-gray-900 text-white">
            <div className="flex justify-between items-center">
              <CardTitle>Meine Festgeldanlagen</CardTitle>
              <Button asChild variant="outline" size="sm" className="bg-white text-gray-900 hover:bg-gray-100">
                <Link href="/anlagen">
                  <Plus className="h-4 w-4 mr-2" />
                  Alle anzeigen
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {anlagen.length === 0 ? (
              <div className="text-center py-8">
                <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Sie haben noch keine Festgeldanlagen.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Kontaktieren Sie einen Administrator, um eine neue Anlage zu erstellen.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Betrag</TableHead>
                      <TableHead>Zinssatz</TableHead>
                      <TableHead>Laufzeit</TableHead>
                      <TableHead>Fortschritt</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anlagen.slice(0, 5).map((anlage) => (
                      <TableRow key={anlage.id}>
                        <TableCell className="font-medium">#{anlage.id}</TableCell>
                        <TableCell>{formatCurrency(anlage.betrag)}</TableCell>
                        <TableCell>{anlage.zinssatz}%</TableCell>
                        <TableCell>{anlage.laufzeit_monate} Monate</TableCell>
                        <TableCell>
                          <div className="w-20">
                            <Progress value={getProgress(anlage)} className="h-2" />
                            <span className="text-xs text-gray-500 mt-1">
                              {Math.round(getProgress(anlage))}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(anlage.status)}</TableCell>
                        <TableCell>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/anlagen/${anlage.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Letzte Transaktionen</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/transaktionen">Alle anzeigen</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {transaktionen.length === 0 ? (
              <p className="text-gray-600 text-center py-4">Keine Transaktionen vorhanden.</p>
            ) : (
              <div className="space-y-4">
                {transaktionen.map((transaktion) => (
                  <div key={transaktion.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{transaktion.beschreibung}</p>
                      <p className="text-sm text-gray-600">{formatDate(transaktion.datum)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaktion.typ === 'einzahlung' ? 'text-green-600' :
                        transaktion.typ === 'auszahlung' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {transaktion.typ === 'auszahlung' ? '-' : '+'}
                        {formatCurrency(transaktion.betrag)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {transaktion.typ}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
