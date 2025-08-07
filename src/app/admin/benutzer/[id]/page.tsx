'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Calendar,
  CreditCard,
  MapPin,
  Building,
  Edit,
  Trash2,
  PiggyBank,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle
} from 'lucide-react';
import {
  apiGetUserById,
  apiDeleteUser,
  apiGetAnlagenByUser,
  apiGetTransaktionenByUser
} from '@/lib/api-storage';
import { User as UserType, FestgeldAnlage, Transaktion } from '@/lib/types';
import { UserModal } from '@/components/admin/user-modal';
import { DeleteConfirmationModal } from '@/components/admin/delete-confirmation-modal';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatKycStatus, formatIbanForDisplay, formatAddress } from '@/lib/account-utils';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [anlagen, setAnlagen] = useState<FestgeldAnlage[]>([]);
  const [transaktionen, setTransaktionen] = useState<Transaktion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const userId = params.id as string;

  useEffect(() => {
    if (userId) {
      loadUserDetails();
    }
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const [userData, anlagenData, transaktionenData] = await Promise.all([
        apiGetUserById(userId),
        apiGetAnlagenByUser(userId),
        apiGetTransaktionenByUser(userId)
      ]);

      if (userData) {
        setUser(userData);
        setAnlagen(anlagenData);
        setTransaktionen(transaktionenData);
      } else {
        toast.error('Benutzer nicht gefunden');
        router.push('/admin/benutzer');
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      toast.error('Fehler beim Laden der Benutzerdetails');
      router.push('/admin/benutzer');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    try {
      const success = await apiDeleteUser(user.id);
      if (success) {
        toast.success('Benutzer erfolgreich gelöscht');
        router.push('/admin/benutzer');
      } else {
        toast.error('Fehler beim Löschen des Benutzers');
      }
    } catch (error) {
      toast.error('Fehler beim Löschen des Benutzers');
    }
  };

  const handleModalSuccess = async () => {
    await loadUserDetails();
  };

  if (loading) {
    return (
      <AppLayout adminOnly>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Benutzerdetails werden geladen...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge className="bg-gray-900 text-white">
        <Shield className="h-3 w-3 mr-1" />
        Administrator
      </Badge>
    ) : (
      <Badge variant="outline">
        <User className="h-3 w-3 mr-1" />
        Benutzer
      </Badge>
    );
  };

  const getKycStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'incomplete':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const totalInvestment = anlagen.reduce((sum, anlage) => sum + anlage.betrag, 0);
  const totalReturns = anlagen.reduce((sum, anlage) => sum + anlage.zinsbetrag, 0);
  const activeAnlagen = anlagen.filter(a => a.status === 'aktiv');

  return (
    <AppLayout adminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/benutzer">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">Benutzerdetails und Kontoübersicht</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={user.role === 'admin' && anlagen.some(a => a.status === 'aktiv')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
          </div>
        </div>

        {/* User Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Persönliche Informationen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(user.role)}
                      <Badge variant="outline" className="text-xs font-mono">
                        ID: {user.id}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Calendar className="h-3 w-3" />
                      <span>Mitglied seit</span>
                    </div>
                    <div className="font-medium">{formatDate(user.created_at)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Activity className="h-3 w-3" />
                      <span>Zuletzt aktualisiert</span>
                    </div>
                    <div className="font-medium">{formatDate(user.updated_at)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Banking Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Banking Informationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Kontonummer</div>
                    <div className="font-mono font-semibold">{user.accountNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">KYC Status</div>
                    <div className="flex items-center gap-2">
                      {getKycStatusIcon(user.kycStatus)}
                      <span className={formatKycStatus(user.kycStatus).color}>
                        {formatKycStatus(user.kycStatus).label}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            {(user.street || user.city || user.postalCode) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Adressinformationen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">{formatAddress(user)}</div>
                </CardContent>
              </Card>
            )}

            {/* Reference Account */}
            {user.referenceIban && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Referenzkonto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 mb-1">IBAN</div>
                      <div className="font-mono">{formatIbanForDisplay(user.referenceIban)}</div>
                    </div>
                    {user.referenceBic && (
                      <div>
                        <div className="text-gray-600 mb-1">BIC</div>
                        <div className="font-mono">{user.referenceBic}</div>
                      </div>
                    )}
                    {user.referenceBankName && (
                      <div className="md:col-span-2">
                        <div className="text-gray-600 mb-1">Bank</div>
                        <div>{user.referenceBankName}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kontostatistiken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Anlagen</span>
                  </div>
                  <span className="font-semibold">{anlagen.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Aktive Anlagen</span>
                  </div>
                  <span className="font-semibold">{activeAnlagen.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-600">Transaktionen</span>
                  </div>
                  <span className="font-semibold">{transaktionen.length}</span>
                </div>

                <hr />

                <div>
                  <div className="text-sm text-gray-600 mb-1">Gesamtinvestition</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(totalInvestment)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Erwartete Erträge</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(totalReturns)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Anlagen */}
        {anlagen.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Festgeldanlagen ({anlagen.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anlage</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Zinssatz</TableHead>
                    <TableHead>Laufzeit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anlagen.slice(0, 5).map((anlage) => (
                    <TableRow key={anlage.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">#{anlage.id}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(anlage.start_datum).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(anlage.betrag)}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {anlage.zinssatz}%
                      </TableCell>
                      <TableCell>{anlage.laufzeit_monate} Monate</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            anlage.status === 'aktiv'
                              ? 'bg-green-500'
                              : 'bg-gray-500'
                          }
                        >
                          {anlage.status === 'aktiv' ? 'Aktiv' : 'Beendet'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/anlagen/${anlage.id}`}>
                            <User className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {anlagen.length > 5 && (
                <div className="mt-4 text-center">
                  <Button asChild variant="outline">
                    <Link href={`/admin/anlagen?userId=${user.id}`}>
                      Alle Anlagen anzeigen ({anlagen.length})
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        {transaktionen.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Letzte Transaktionen ({transaktionen.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Beschreibung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaktionen.slice(0, 5).map((transaktion) => (
                    <TableRow key={transaktion.id}>
                      <TableCell className="text-sm">
                        {new Date(transaktion.datum).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            transaktion.typ === 'einzahlung'
                              ? 'text-green-600'
                              : transaktion.typ === 'auszahlung'
                              ? 'text-red-600'
                              : 'text-blue-600'
                          }
                        >
                          {transaktion.typ}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(transaktion.betrag)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {transaktion.beschreibung}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        <UserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleModalSuccess}
          user={user}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteUser}
          title="Benutzer löschen"
          description={`Sind Sie sicher, dass Sie den Benutzer "${user.name}" löschen möchten?`}
          itemName={user.name}
          additionalWarnings={[
            'Alle zugehörigen Anlagen und Transaktionen werden ebenfalls gelöscht',
            'Diese Aktion kann nicht rückgängig gemacht werden',
            user.role === 'admin' ? 'Administrator-Rechte gehen verloren' : ''
          ].filter(Boolean)}
        />
      </div>
    </AppLayout>
  );
}
