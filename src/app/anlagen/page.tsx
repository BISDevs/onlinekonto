'use client';

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
  Eye,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiGetAnlagenByUser } from '@/lib/api-storage';
import { FestgeldAnlage } from '@/lib/types';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AnlagenPage() {
  const { user } = useAuth();
  const [anlagen, setAnlagen] = useState<FestgeldAnlage[]>([]);

  useEffect(() => {
    if (user) {
      const loadAnlagen = async () => {
        try {
          const userAnlagen = await apiGetAnlagenByUser(user.id);
          setAnlagen(userAnlagen);
        } catch (error) {
          console.error('Error loading anlagen:', error);
        }
      };
      loadAnlagen();
    }
  }, [user]);

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

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const totalInvestment = anlagen.reduce((sum, anlage) => sum + anlage.betrag, 0);
  const totalInterest = anlagen.reduce((sum, anlage) => sum + anlage.zinsbetrag, 0);
  const activeAnlagen = anlagen.filter(anlage => anlage.status === 'aktiv');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meine Festgeldanlagen</h1>
          <p className="text-gray-600">Verwalten Sie Ihre Festgeldanlagen und verfolgen Sie deren Performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gesamtinvestition</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalInvestment)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
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
                <Calendar className="h-8 w-8 text-blue-600" />
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
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Anlagen Table */}
        <Card>
          <CardHeader>
            <CardTitle>Alle Festgeldanlagen</CardTitle>
          </CardHeader>
          <CardContent>
            {anlagen.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Anlagen vorhanden</h3>
                <p className="text-gray-600 mb-6">
                  Sie haben noch keine Festgeldanlagen. Kontaktieren Sie einen Administrator,
                  um eine neue Anlage zu erstellen.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Anlage-ID</TableHead>
                      <TableHead>Betrag</TableHead>
                      <TableHead>Zinssatz</TableHead>
                      <TableHead>Laufzeit</TableHead>
                      <TableHead>Startdatum</TableHead>
                      <TableHead>Enddatum</TableHead>
                      <TableHead>Fortschritt</TableHead>
                      <TableHead>Zinsbetrag</TableHead>
                      <TableHead>Endbetrag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anlagen.map((anlage) => {
                      const progress = getProgress(anlage);
                      const daysRemaining = getDaysRemaining(anlage.end_datum);

                      return (
                        <TableRow key={anlage.id}>
                          <TableCell className="font-medium">#{anlage.id}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(anlage.betrag)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-green-600">
                              {anlage.zinssatz}%
                            </span>
                          </TableCell>
                          <TableCell>{anlage.laufzeit_monate} Monate</TableCell>
                          <TableCell>{formatDate(anlage.start_datum)}</TableCell>
                          <TableCell>
                            {formatDate(anlage.end_datum)}
                            {anlage.status === 'aktiv' && daysRemaining > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {daysRemaining} Tage verbleibend
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={progress} className="h-2 w-20" />
                              <span className="text-xs text-gray-500">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(anlage.zinsbetrag)}
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(anlage.endbetrag)}
                          </TableCell>
                          <TableCell>{getStatusBadge(anlage.status)}</TableCell>
                          <TableCell>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/anlagen/${anlage.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
