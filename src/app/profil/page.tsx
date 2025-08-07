'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Shield,
  Edit,
  Save,
  X,
  Calendar,
  Activity,
  CreditCard,
  MapPin,
  Building,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGetUserById } from '@/lib/api-storage';
import { User as UserType } from '@/lib/types';
import { formatKycStatus, formatIbanForDisplay, formatAddress } from '@/lib/account-utils';

export default function ProfilPage() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    if (authUser?.id) {
      loadUserProfile();
    }
  }, [authUser]);

  const loadUserProfile = async () => {
    if (!authUser?.id) return;

    try {
      setLoading(true);
      const userData = await apiGetUserById(authUser.id);
      if (userData) {
        setUser(userData);
        setFormData({
          name: userData.name,
          email: userData.email
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Fehler beim Laden des Profils');
    } finally {
      setLoading(false);
    }
  };

  if (!authUser) return null;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Profil wird geladen...</p>
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

  const handleSave = () => {
    // In a real app, this would make an API call to update the user
    toast.success('Profil wurde erfolgreich aktualisiert');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email
    });
    setIsEditing(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-gray-900">Administrator</Badge>;
      case 'user':
        return <Badge className="bg-blue-500">Benutzer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mein Profil</h1>
          <p className="text-gray-600">Verwalten Sie Ihre persönlichen Informationen und Einstellungen</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Persönliche Informationen
                  </CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Abbrechen
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="bg-gray-900 hover:bg-gray-800"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Speichern
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {getRoleBadge(user.role)}
                      <Badge variant="outline" className="text-xs">
                        ID: {user.id}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Vollständiger Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        {user.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">E-Mail Adresse</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <Alert>
                    <AlertDescription>
                      Änderungen an Ihrem Profil werden sofort gespeichert und sind systemweit sichtbar.
                    </AlertDescription>
                  </Alert>
                )}
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
                    <Label className="text-sm text-gray-600">Kontonummer</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md font-mono font-semibold">
                      {user.accountNumber}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">KYC Verifizierungsstatus</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2">
                        {getKycStatusIcon(user.kycStatus)}
                        <span className={formatKycStatus(user.kycStatus).color}>
                          {formatKycStatus(user.kycStatus).label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {user.kycStatus === 'pending' && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Ihre Identitätsverifizierung wird noch geprüft. Dies kann bis zu 2 Werktage dauern.
                    </AlertDescription>
                  </Alert>
                )}

                {user.kycStatus === 'incomplete' && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Ihre Verifizierung ist unvollständig. Bitte reichen Sie die fehlenden Dokumente nach.
                    </AlertDescription>
                  </Alert>
                )}
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
                  <div className="p-3 bg-gray-50 rounded-md">
                    {formatAddress(user)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reference Account */}
            {user.referenceIban && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Referenzkonto für Überweisungen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">IBAN</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md font-mono">
                        {formatIbanForDisplay(user.referenceIban)}
                      </div>
                    </div>

                    {user.referenceBic && (
                      <div>
                        <Label className="text-sm text-gray-600">BIC</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md font-mono">
                          {user.referenceBic}
                        </div>
                      </div>
                    )}
                  </div>

                  {user.referenceBankName && (
                    <div>
                      <Label className="text-sm text-gray-600">Bankname</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        {user.referenceBankName}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Account Info Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Kontostatus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Benutzer-ID</span>
                  </div>
                  <span className="font-mono text-sm">{user.id}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Rolle</span>
                  </div>
                  {getRoleBadge(user.role)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">E-Mail Status</span>
                  </div>
                  <Badge className="bg-green-500">Verifiziert</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Konto Status</span>
                  </div>
                  <Badge className="bg-green-500">Aktiv</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">KYC Status</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getKycStatusIcon(user.kycStatus)}
                    <span className={`text-sm ${formatKycStatus(user.kycStatus).color}`}>
                      {formatKycStatus(user.kycStatus).label}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Kontoaktivität
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Mitglied seit</div>
                  <div className="font-medium">{formatDate(user.created_at)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Zuletzt aktualisiert</div>
                  <div className="font-medium">{formatDate(user.updated_at)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Kontonummer</div>
                  <div className="font-mono text-sm">{user.accountNumber}</div>
                </div>
              </CardContent>
            </Card>

            {user.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Administrator-Bereich
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Sie haben Administrator-Rechte und können alle Bereiche des Systems verwalten.
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href="/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin-Panel öffnen
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
