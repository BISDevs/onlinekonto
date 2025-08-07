'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Calculator
} from 'lucide-react';
import { apiGetAnlagen, apiGetTransaktionen, apiGetUserById } from '@/lib/api-storage';
import { FestgeldAnlage, Transaktion, User } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AnlageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [anlage, setAnlage] = useState<FestgeldAnlage | null>(null);
  const [anlagenUser, setAnlagenUser] = useState<User | null>(null);
  const [transaktionen, setTransaktionen] = useState<Transaktion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadAnlageDetails(parseInt(params.id as string));
    }
  }, [params.id]);

  const loadAnlageDetails = async (anlageId: number) => {
    try {
      const anlagen = await apiGetAnlagen();
      const foundAnlage = anlagen.find(a => a.id === anlageId);

      if (!foundAnlage) {
        toast.error('Anlage nicht gefunden');
        router.push('/anlagen');
        return;
      }

      // Check if user has access to this anlage
      console.log('Authorization check:', {
        userRole: user?.role,
        userId: user?.id,
        anlageUserId: foundAnlage.user_id,
        hasAccess: user?.role === 'admin' || foundAnlage.user_id === user?.id
      });

      if (user?.role !== 'admin' && foundAnlage.user_id !== user?.id) {
        toast.error('Keine Berechtigung für diese Anlage');
        router.push('/anlagen');
        return;
      }

      setAnlage(foundAnlage);

      // Load user data and transactions in parallel
      const [userInfo, allTransaktionen] = await Promise.all([
        apiGetUserById(foundAnlage.user_id),
        apiGetTransaktionen()
      ]);

      setAnlagenUser(userInfo);

      const anlageTransaktionen = allTransaktionen.filter(t => t.anlage_id === anlageId);
      setTransaktionen(anlageTransaktionen);

      setLoading(false);
    } catch (error) {
      toast.error('Fehler beim Laden der Anlage-Details');
      router.push('/anlagen');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </AppLayout>
    );
  }

  if (!anlage) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Anlage nicht gefunden</h3>
          <p className="text-gray-600 mb-6">Die angeforderte Anlage existiert nicht oder Sie haben keine Berechtigung.</p>
          <Button asChild>
            <Link href="/anlagen">Zurück zu Anlagen</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgress = () => {
    const startDate = new Date(anlage.start_datum);
    const endDate = new Date(anlage.end_datum);
    const now = new Date();

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();

    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  };

  const getDaysRemaining = () => {
    const endDate = new Date(anlage.end_datum);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const getStatusIcon = () => {
    switch (anlage.status) {
      case 'aktiv':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'beendet':
        return <CheckCircle className="h-5 w-5 text-gray-600" />;
      case 'vorzeitig_beendet':
        return <XCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (anlage.status) {
      case 'aktiv':
        return <Badge className="bg-green-500">Aktiv</Badge>;
      case 'beendet':
        return <Badge variant="secondary">Beendet</Badge>;
      case 'vorzeitig_beendet':
        return <Badge className="bg-yellow-500">Vorzeitig beendet</Badge>;
      default:
        return <Badge variant="outline">{anlage.status}</Badge>;
    }
  };

  const getMonthlyBreakdown = () => {
    const breakdown = [];
    const monthlyInterestRate = anlage.zinssatz / 100 / 12;
    let currentAmount = anlage.betrag;

    for (let month = 1; month <= anlage.laufzeit_monate; month++) {
      const monthlyInterest = currentAmount * monthlyInterestRate;
      currentAmount += monthlyInterest;

      breakdown.push({
        month,
        monthlyInterest,
        totalAmount: currentAmount,
        totalInterest: currentAmount - anlage.betrag
      });
    }

    return breakdown;
  };

  const progress = getProgress();
  const daysRemaining = getDaysRemaining();
  const monthlyBreakdown = getMonthlyBreakdown();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/anlagen">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Festgeldanlage #{anlage.id}
              </h1>
              <p className="text-gray-600">
                {anlagenUser?.name} • Erstellt am {formatDate(anlage.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </div>

        {/* Status Alert */}
        {anlage.status === 'aktiv' && daysRemaining <= 30 && daysRemaining > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Diese Anlage läuft in {daysRemaining} Tagen ab. Der Endbetrag wird automatisch ausgezahlt.
            </AlertDescription>
          </Alert>
        )}

        {anlage.status === 'vorzeitig_beendet' && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Diese Anlage wurde vorzeitig beendet. Zinserträge wurden möglicherweise reduziert.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Anlagebetrag</p>
                      <p className="text-2xl font-bold">{formatCurrency(anlage.betrag)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Zinssatz</p>
                      <p className="text-2xl font-bold">{anlage.zinssatz}%</p>
                      <p className="text-xs text-gray-500">pro Jahr</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Erwarteter Ertrag</p>
                      <p className="text-2xl font-bold">{formatCurrency(anlage.zinsbetrag)}</p>
                    </div>
                    <Calculator className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Laufzeit-Fortschritt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Fortschritt</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Startdatum</span>
                    </div>
                    <p className="font-semibold">{formatDate(anlage.start_datum)}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Laufzeit</span>
                    </div>
                    <p className="font-semibold">{anlage.laufzeit_monate} Monate</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Enddatum</span>
                    </div>
                    <p className="font-semibold">{formatDate(anlage.end_datum)}</p>
                    {anlage.status === 'aktiv' && daysRemaining > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        in {daysRemaining} Tagen
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle>Transaktionsverlauf</CardTitle>
              </CardHeader>
              <CardContent>
                {transaktionen.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">Keine Transaktionen vorhanden</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum</TableHead>
                          <TableHead>Typ</TableHead>
                          <TableHead>Beschreibung</TableHead>
                          <TableHead className="text-right">Betrag</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transaktionen.map((transaktion) => (
                          <TableRow key={transaktion.id}>
                            <TableCell className="font-medium">
                              {formatDateTime(transaktion.datum)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  transaktion.typ === 'einzahlung' ? 'bg-green-500' :
                                  transaktion.typ === 'auszahlung' ? 'bg-red-500' :
                                  'bg-blue-500'
                                }
                              >
                                {transaktion.typ}
                              </Badge>
                            </TableCell>
                            <TableCell>{transaktion.beschreibung}</TableCell>
                            <TableCell className="text-right">
                              <span className={
                                transaktion.typ === 'auszahlung' ? 'text-red-600' : 'text-green-600'
                              }>
                                {transaktion.typ === 'auszahlung' ? '-' : '+'}
                                {formatCurrency(transaktion.betrag)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Übersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Anlagebetrag:</span>
                    <span className="font-semibold">{formatCurrency(anlage.betrag)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Zinssatz:</span>
                    <span className="font-semibold">{anlage.zinssatz}% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Laufzeit:</span>
                    <span className="font-semibold">{anlage.laufzeit_monate} Monate</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Zinserträge:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(anlage.zinsbetrag)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Endbetrag:</span>
                      <span className="font-bold text-lg">{formatCurrency(anlage.endbetrag)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Monatliche Aufschlüsselung
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Monatliche Zinsaufschlüsselung</DialogTitle>
                      <DialogDescription>
                        Detaillierte Entwicklung der Anlage über die gesamte Laufzeit
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Monat</TableHead>
                            <TableHead>Monatszinsen</TableHead>
                            <TableHead>Gesamtbetrag</TableHead>
                            <TableHead>Zinsen gesamt</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monthlyBreakdown.map((month) => (
                            <TableRow key={month.month}>
                              <TableCell className="font-medium">{month.month}</TableCell>
                              <TableCell className="text-green-600">
                                {formatCurrency(month.monthlyInterest)}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(month.totalAmount)}
                              </TableCell>
                              <TableCell className="text-blue-600">
                                {formatCurrency(month.totalInterest)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Bericht exportieren
                </Button>

                {user?.role === 'admin' && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/admin/anlagen/${anlage.id}/bearbeiten`}>
                      <Calculator className="h-4 w-4 mr-2" />
                      Als Admin bearbeiten
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* User Info (Admin Only) */}
            {user?.role === 'admin' && anlagenUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kunde</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">{anlagenUser.name}</p>
                      <p className="text-sm text-gray-600">{anlagenUser.email}</p>
                      <p className="text-xs text-gray-500">ID: {anlagenUser.id}</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/admin/benutzer/${anlagenUser.id}`}>
                        Kunde anzeigen
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
