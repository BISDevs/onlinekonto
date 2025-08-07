'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User } from '@/lib/types';
import { apiCreateUser, apiUpdateUser } from '@/lib/api-storage';
import {
  generateAccountNumber,
  getCountriesList,
  getKycStatusOptions,
  validateIban
} from '@/lib/account-utils';
import { toast } from 'sonner';
import { AlertCircle, Save, X, CreditCard, MapPin, Building } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
}

interface UserFormData {
  name: string;
  email: string;
  role: 'user' | 'admin';
  password?: string;
  confirmPassword?: string;

  // Banking Information
  accountNumber: string;
  kycStatus: 'pending' | 'verified' | 'rejected' | 'incomplete';

  // Address Information
  street: string;
  postalCode: string;
  city: string;
  country: string;

  // Reference Account
  referenceIban: string;
  referenceBic: string;
  referenceBankName: string;
}

export function UserModal({ isOpen, onClose, onSuccess, user }: UserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'user',
    password: '',
    confirmPassword: '',
    accountNumber: '',
    kycStatus: 'pending',
    street: '',
    postalCode: '',
    city: '',
    country: 'Deutschland',
    referenceIban: '',
    referenceBic: '',
    referenceBankName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role as 'user' | 'admin',
        password: '',
        confirmPassword: '',
        accountNumber: user.accountNumber,
        kycStatus: user.kycStatus,
        street: user.street || '',
        postalCode: user.postalCode || '',
        city: user.city || '',
        country: user.country || 'Deutschland',
        referenceIban: user.referenceIban || '',
        referenceBic: user.referenceBic || '',
        referenceBankName: user.referenceBankName || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'user',
        password: '',
        confirmPassword: '',
        accountNumber: generateAccountNumber(),
        kycStatus: 'pending',
        street: '',
        postalCode: '',
        city: '',
        country: 'Deutschland',
        referenceIban: '',
        referenceBic: '',
        referenceBankName: '',
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Passwort ist erforderlich';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Passwort muss mindestens 6 Zeichen lang sein';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
      }
    } else if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Passwort muss mindestens 6 Zeichen lang sein';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
      }
    }

    // Address validation (optional but if provided, should be complete)
    const hasAnyAddress = formData.street || formData.postalCode || formData.city;
    if (hasAnyAddress) {
      if (!formData.street) {
        newErrors.street = 'Straße ist erforderlich wenn Adresse angegeben';
      }
      if (!formData.postalCode) {
        newErrors.postalCode = 'PLZ ist erforderlich wenn Adresse angegeben';
      }
      if (!formData.city) {
        newErrors.city = 'Stadt ist erforderlich wenn Adresse angegeben';
      }
    }

    // Reference account validation (optional but if IBAN provided, should be valid)
    if (formData.referenceIban && !validateIban(formData.referenceIban)) {
      newErrors.referenceIban = 'Ungültiges IBAN-Format';
    }

    if (formData.referenceIban && !formData.referenceBankName) {
      newErrors.referenceBankName = 'Bankname ist erforderlich wenn IBAN angegeben';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isEditing && user) {
        const updateData: {
          name: string;
          email: string;
          role: string;
          password?: string;
          accountNumber?: string;
          kycStatus?: string;
          street?: string;
          postalCode?: string;
          city?: string;
          country?: string;
          referenceIban?: string;
          referenceBic?: string;
          referenceBankName?: string;
        } = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          accountNumber: formData.accountNumber,
          kycStatus: formData.kycStatus,
          street: formData.street || undefined,
          postalCode: formData.postalCode || undefined,
          city: formData.city || undefined,
          country: formData.country,
          referenceIban: formData.referenceIban || undefined,
          referenceBic: formData.referenceBic || undefined,
          referenceBankName: formData.referenceBankName || undefined,
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        const result = await apiUpdateUser(user.id, updateData);
        if (result) {
          toast.success('Benutzer erfolgreich aktualisiert');
          onSuccess();
          onClose();
        } else {
          toast.error('Fehler beim Aktualisieren des Benutzers');
        }
      } else {
        const result = await apiCreateUser({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          accountNumber: formData.accountNumber,
          kycStatus: formData.kycStatus,
          street: formData.street || undefined,
          postalCode: formData.postalCode || undefined,
          city: formData.city || undefined,
          country: formData.country,
          referenceIban: formData.referenceIban || undefined,
          referenceBic: formData.referenceBic || undefined,
          referenceBankName: formData.referenceBankName || undefined,
        });

        if (result) {
          toast.success('Benutzer erfolgreich erstellt');
          onSuccess();
          onClose();
        } else {
          toast.error('Fehler beim Erstellen des Benutzers');
        }
      }
    } catch (error) {
      console.error('User operation error:', error);
      toast.error('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      role: 'user',
      password: '',
      confirmPassword: '',
      accountNumber: generateAccountNumber(),
      kycStatus: 'pending',
      street: '',
      postalCode: '',
      city: '',
      country: 'Deutschland',
      referenceIban: '',
      referenceBic: '',
      referenceBankName: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Benutzer bearbeiten' : 'Neuen Benutzer erstellen'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Vollständiger Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Max Mustermann"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">E-Mail Adresse</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="max@beispiel.de"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="role">Rolle</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'user' | 'admin') =>
                setFormData(prev => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Benutzer</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-600 mt-1">{errors.role}</p>
            )}
          </div>

          {!isEditing && (
            <>
              <div>
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mindestens 6 Zeichen"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Passwort wiederholen"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </>
          )}

          {isEditing && (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Lassen Sie die Passwort-Felder leer, um das aktuelle Passwort beizubehalten.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="newPassword">Neues Passwort (optional)</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mindestens 6 Zeichen"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                )}
              </div>

              {formData.password && (
                <div>
                  <Label htmlFor="confirmNewPassword">Neues Passwort bestätigen</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Neues Passwort wiederholen"
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Banking Information Section */}
          <div className="border-t pt-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <CreditCard className="h-5 w-5" />
              Banking Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountNumber">Kontonummer</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="OK-2025-ABC123"
                  className={errors.accountNumber ? 'border-red-500' : ''}
                />
                {errors.accountNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.accountNumber}</p>
                )}
              </div>

              <div>
                <Label htmlFor="kycStatus">KYC Status</Label>
                <Select
                  value={formData.kycStatus}
                  onValueChange={(value: 'pending' | 'verified' | 'rejected' | 'incomplete') =>
                    setFormData(prev => ({ ...prev, kycStatus: value }))
                  }
                >
                  <SelectTrigger className={errors.kycStatus ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getKycStatusOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.kycStatus && (
                  <p className="text-sm text-red-600 mt-1">{errors.kycStatus}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div className="border-t pt-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <MapPin className="h-5 w-5" />
              Adressdaten
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="street">Straße und Hausnummer</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Musterstraße 123"
                  className={errors.street ? 'border-red-500' : ''}
                />
                {errors.street && (
                  <p className="text-sm text-red-600 mt-1">{errors.street}</p>
                )}
              </div>

              <div>
                <Label htmlFor="postalCode">Postleitzahl</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="12345"
                  className={errors.postalCode ? 'border-red-500' : ''}
                />
                {errors.postalCode && (
                  <p className="text-sm text-red-600 mt-1">{errors.postalCode}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Berlin"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-600 mt-1">{errors.city}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="country">Land</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getCountriesList().map(country => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="text-sm text-red-600 mt-1">{errors.country}</p>
                )}
              </div>
            </div>
          </div>

          {/* Reference Account Section */}
          <div className="border-t pt-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Building className="h-5 w-5" />
              Referenzkonto (optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="referenceIban">IBAN</Label>
                <Input
                  id="referenceIban"
                  value={formData.referenceIban}
                  onChange={(e) => setFormData(prev => ({ ...prev, referenceIban: e.target.value.toUpperCase() }))}
                  placeholder="DE89 3704 0044 0532 0130 00"
                  className={errors.referenceIban ? 'border-red-500' : ''}
                />
                {errors.referenceIban && (
                  <p className="text-sm text-red-600 mt-1">{errors.referenceIban}</p>
                )}
              </div>

              <div>
                <Label htmlFor="referenceBic">BIC (optional)</Label>
                <Input
                  id="referenceBic"
                  value={formData.referenceBic}
                  onChange={(e) => setFormData(prev => ({ ...prev, referenceBic: e.target.value.toUpperCase() }))}
                  placeholder="COBADEFFXXX"
                  className={errors.referenceBic ? 'border-red-500' : ''}
                />
                {errors.referenceBic && (
                  <p className="text-sm text-red-600 mt-1">{errors.referenceBic}</p>
                )}
              </div>

              <div>
                <Label htmlFor="referenceBankName">Bankname</Label>
                <Input
                  id="referenceBankName"
                  value={formData.referenceBankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, referenceBankName: e.target.value }))}
                  placeholder="Commerzbank AG"
                  className={errors.referenceBankName ? 'border-red-500' : ''}
                />
                {errors.referenceBankName && (
                  <p className="text-sm text-red-600 mt-1">{errors.referenceBankName}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Speichern...' : (isEditing ? 'Aktualisieren' : 'Erstellen')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
