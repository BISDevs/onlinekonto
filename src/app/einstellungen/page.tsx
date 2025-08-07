'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  User,
  Shield,
  Bell,
  Eye,
  Download,
  Trash2,
  Key,
  Database,
  Moon,
  Sun,
  Globe,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

export default function EinstellungenPage() {
  const { user, resetData } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false
    },
    privacy: {
      shareData: false,
      analytics: true,
      marketing: false
    },
    display: {
      darkMode: false,
      language: 'de',
      currency: 'EUR'
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  if (!user) return null;

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
    toast.success('Benachrichtigungseinstellungen aktualisiert');
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
    toast.success('Datenschutzeinstellungen aktualisiert');
  };

  const handleDisplayChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      display: {
        ...prev.display,
        [key]: value
      }
    }));
    toast.success('Anzeigeeinstellungen aktualisiert');
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    // In a real app, this would make an API call
    toast.success('Passwort erfolgreich geändert');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleExportData = () => {
    // In a real app, this would generate and download user data
    toast.success('Datenexport wird vorbereitet. Sie erhalten eine E-Mail mit dem Download-Link.');
  };

  const handleDeleteAccount = () => {
    // In a real app, this would show a confirmation dialog and delete the account
    toast.error('Kontolöschung in der Demo nicht verfügbar');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Einstellungen</h1>
          <p className="text-gray-600">Verwalten Sie Ihre Kontoeinstellungen und Präferenzen</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profilinformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="displayName">Anzeigename</Label>
                    <Input
                      id="displayName"
                      defaultValue={user.name}
                      placeholder="Ihr Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-Mail Adresse</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user.email}
                      placeholder="ihre-email@beispiel.de"
                    />
                  </div>
                </div>
                <Button className="bg-gray-900 hover:bg-gray-800">
                  <Save className="h-4 w-4 mr-2" />
                  Profil speichern
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sicherheit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Passwort ändern</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">Neues Passwort</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handlePasswordChange}>
                      <Key className="h-4 w-4 mr-2" />
                      Passwort ändern
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Zwei-Faktor-Authentifizierung</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Erhöhen Sie die Sicherheit Ihres Kontos durch eine zusätzliche Authentifizierungsebene.
                  </p>
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    2FA einrichten
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Benachrichtigungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">E-Mail Benachrichtigungen</Label>
                      <p className="text-sm text-gray-600">Erhalten Sie Updates zu Ihren Anlagen per E-Mail</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Browser-Benachrichtigungen</Label>
                      <p className="text-sm text-gray-600">Push-Benachrichtigungen im Browser</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Benachrichtigungen</Label>
                      <p className="text-sm text-gray-600">Wichtige Updates per SMS</p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={settings.notifications.sms}
                      onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Datenschutz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="share-data">Daten teilen</Label>
                      <p className="text-sm text-gray-600">Anonyme Nutzungsdaten für Verbesserungen teilen</p>
                    </div>
                    <Switch
                      id="share-data"
                      checked={settings.privacy.shareData}
                      onCheckedChange={(checked) => handlePrivacyChange('shareData', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="analytics">Analyse-Cookies</Label>
                      <p className="text-sm text-gray-600">Helfen Sie uns, die Anwendung zu verbessern</p>
                    </div>
                    <Switch
                      id="analytics"
                      checked={settings.privacy.analytics}
                      onCheckedChange={(checked) => handlePrivacyChange('analytics', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing">Marketing-E-Mails</Label>
                      <p className="text-sm text-gray-600">Informationen über neue Features und Angebote</p>
                    </div>
                    <Switch
                      id="marketing"
                      checked={settings.privacy.marketing}
                      onCheckedChange={(checked) => handlePrivacyChange('marketing', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Display Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Anzeige
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={settings.display.darkMode}
                    onCheckedChange={(checked) => handleDisplayChange('darkMode', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="language" className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4" />
                    Sprache
                  </Label>
                  <select
                    id="language"
                    className="w-full p-2 border rounded-md"
                    value={settings.display.language}
                    onChange={(e) => handleDisplayChange('language', e.target.value)}
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="currency" className="mb-2 block">Währung</Label>
                  <select
                    id="currency"
                    className="w-full p-2 border rounded-md"
                    value={settings.display.currency}
                    onChange={(e) => handleDisplayChange('currency', e.target.value)}
                  >
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Daten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExportData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Daten exportieren
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resetData}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Cache zurücksetzen
                </Button>

                <Separator />

                <div>
                  <h4 className="font-medium text-red-600 mb-2">Gefahrenzone</h4>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDeleteAccount}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Konto löschen
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card>
              <CardHeader>
                <CardTitle>Hilfe & Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Benötigen Sie Hilfe? Kontaktieren Sie unser Support-Team.
                </p>
                <Button variant="outline" className="w-full">
                  Support kontaktieren
                </Button>
                <Button variant="outline" className="w-full">
                  Dokumentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
