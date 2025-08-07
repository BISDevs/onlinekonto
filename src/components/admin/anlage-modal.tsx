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
import { Card, CardContent } from '@/components/ui/card';
import { FestgeldAnlage, User } from '@/lib/types';
import { apiCreateAnlage, apiUpdateAnlage, apiGetUsers } from '@/lib/api-storage';
import { calculateInterest } from '@/lib/api-storage';
import { toast } from 'sonner';
import { Calculator, Save, X, TrendingUp } from 'lucide-react';

interface AnlageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  anlage?: FestgeldAnlage | null;
}

interface AnlageFormData {
  userId: string | null;
  betrag: string;
  zinssatz: string;
  laufzeitMonate: string;
  startDatum: string;
  status?: string;
}

export function AnlageModal({ isOpen, onClose, onSuccess, anlage }: AnlageModalProps) {
  const [formData, setFormData] = useState<AnlageFormData>({
    userId: null,
    betrag: '',
    zinssatz: '',
    laufzeitMonate: '',
    startDatum: new Date().toISOString().split('T')[0],
    status: 'aktiv',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState<{
    zinsbetrag: number;
    endbetrag: number;
  } | null>(null);

  const isEditing = !!anlage;

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (anlage) {
      setFormData({
        userId: anlage.user_id,
        betrag: anlage.betrag.toString(),
        zinssatz: anlage.zinssatz.toString(),
        laufzeitMonate: anlage.laufzeit_monate.toString(),
        startDatum: anlage.start_datum,
        status: anlage.status,
      });
    } else {
      setFormData({
        userId: null,
        betrag: '',
        zinssatz: '',
        laufzeitMonate: '',
        startDatum: new Date().toISOString().split('T')[0],
        status: 'aktiv',
      });
    }
    setErrors({});
    setCalculation(null);
  }, [anlage, isOpen]);

  useEffect(() => {
    // Auto-calculate when all required fields are filled
    if (formData.betrag && formData.zinssatz && formData.laufzeitMonate) {
      const betrag = parseFloat(formData.betrag);
      const zinssatz = parseFloat(formData.zinssatz);
      const laufzeit = parseInt(formData.laufzeitMonate);

      if (!isNaN(betrag) && !isNaN(zinssatz) && !isNaN(laufzeit)) {
        const result = calculateInterest(betrag, zinssatz, laufzeit);
        setCalculation(result);
      } else {
        setCalculation(null);
      }
    } else {
      setCalculation(null);
    }
  }, [formData.betrag, formData.zinssatz, formData.laufzeitMonate]);

  const loadUsers = async () => {
    try {
      const allUsers = await apiGetUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Fehler beim Laden der Benutzer');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId) {
      newErrors.userId = 'Benutzer ist erforderlich';
    }

    if (!formData.betrag) {
      newErrors.betrag = 'Betrag ist erforderlich';
    } else {
      const betrag = parseFloat(formData.betrag);
      if (isNaN(betrag) || betrag <= 0) {
        newErrors.betrag = 'Betrag muss eine positive Zahl sein';
      } else if (betrag < 1000) {
        newErrors.betrag = 'Mindestbetrag ist 1.000 €';
      }
    }

    if (!formData.zinssatz) {
      newErrors.zinssatz = 'Zinssatz ist erforderlich';
    } else {
      const zinssatz = parseFloat(formData.zinssatz);
      if (isNaN(zinssatz) || zinssatz < 0) {
        newErrors.zinssatz = 'Zinssatz muss eine positive Zahl sein';
      } else if (zinssatz > 20) {
        newErrors.zinssatz = 'Zinssatz scheint unrealistisch hoch zu sein';
      }
    }

    if (!formData.laufzeitMonate) {
      newErrors.laufzeitMonate = 'Laufzeit ist erforderlich';
    } else {
      const laufzeit = parseInt(formData.laufzeitMonate);
      if (isNaN(laufzeit) || laufzeit <= 0) {
        newErrors.laufzeitMonate = 'Laufzeit muss eine positive Zahl sein';
      } else if (laufzeit < 3) {
        newErrors.laufzeitMonate = 'Mindestlaufzeit ist 3 Monate';
      } else if (laufzeit > 120) {
        newErrors.laufzeitMonate = 'Maximale Laufzeit ist 120 Monate';
      }
    }

    if (!formData.startDatum) {
      newErrors.startDatum = 'Startdatum ist erforderlich';
    } else {
      const startDate = new Date(formData.startDatum);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.startDatum = 'Startdatum kann nicht in der Vergangenheit liegen';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isEditing && anlage) {
        const updateData: {
          betrag: number;
          zinssatz: number;
          laufzeitMonate: number;
          startDatum: string;
          status?: string;
        } = {
          betrag: parseFloat(formData.betrag),
          zinssatz: parseFloat(formData.zinssatz),
          laufzeitMonate: parseInt(formData.laufzeitMonate),
          startDatum: formData.startDatum,
        };

        if (formData.status) {
          updateData.status = formData.status;
        }

        const result = await apiUpdateAnlage(anlage.id, updateData);
        if (result) {
          toast.success('Anlage erfolgreich aktualisiert');
          onSuccess();
          onClose();
        } else {
          toast.error('Fehler beim Aktualisieren der Anlage');
        }
      } else {
        const result = await apiCreateAnlage({
          userId: formData.userId!,
          betrag: parseFloat(formData.betrag),
          zinssatz: parseFloat(formData.zinssatz),
          laufzeitMonate: parseInt(formData.laufzeitMonate),
          startDatum: formData.startDatum,
        });

        if (result) {
          toast.success('Anlage erfolgreich erstellt');
          onSuccess();
          onClose();
        } else {
          toast.error('Fehler beim Erstellen der Anlage');
        }
      }
    } catch (error) {
      console.error('Anlage operation error:', error);
      toast.error('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      userId: null,
      betrag: '',
      zinssatz: '',
      laufzeitMonate: '',
      startDatum: new Date().toISOString().split('T')[0],
      status: 'aktiv',
    });
    setErrors({});
    setCalculation(null);
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.name} (${user.email})` : `Benutzer ${userId}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Anlage bearbeiten' : 'Neue Festgeldanlage erstellen'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userId">Kunde</Label>
              {isEditing ? (
                <div className="p-3 bg-gray-50 rounded-md border">
                  {anlage && getUserName(anlage.user_id)}
                </div>
              ) : (
                <Select
                  value={formData.userId || ''}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, userId: value }))
                  }
                >
                  <SelectTrigger className={errors.userId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Kunde auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.userId && (
                <p className="text-sm text-red-600 mt-1">{errors.userId}</p>
              )}
            </div>

            <div>
              <Label htmlFor="betrag">Anlagebetrag (€)</Label>
              <Input
                id="betrag"
                type="number"
                value={formData.betrag}
                onChange={(e) => setFormData(prev => ({ ...prev, betrag: e.target.value }))}
                placeholder="10000"
                min="1000"
                step="100"
                className={errors.betrag ? 'border-red-500' : ''}
              />
              {errors.betrag && (
                <p className="text-sm text-red-600 mt-1">{errors.betrag}</p>
              )}
            </div>

            <div>
              <Label htmlFor="zinssatz">Zinssatz pro Jahr (%)</Label>
              <Input
                id="zinssatz"
                type="number"
                value={formData.zinssatz}
                onChange={(e) => setFormData(prev => ({ ...prev, zinssatz: e.target.value }))}
                placeholder="3.5"
                min="0"
                max="20"
                step="0.1"
                className={errors.zinssatz ? 'border-red-500' : ''}
              />
              {errors.zinssatz && (
                <p className="text-sm text-red-600 mt-1">{errors.zinssatz}</p>
              )}
            </div>

            <div>
              <Label htmlFor="laufzeitMonate">Laufzeit (Monate)</Label>
              <Input
                id="laufzeitMonate"
                type="number"
                value={formData.laufzeitMonate}
                onChange={(e) => setFormData(prev => ({ ...prev, laufzeitMonate: e.target.value }))}
                placeholder="12"
                min="3"
                max="120"
                step="1"
                className={errors.laufzeitMonate ? 'border-red-500' : ''}
              />
              {errors.laufzeitMonate && (
                <p className="text-sm text-red-600 mt-1">{errors.laufzeitMonate}</p>
              )}
            </div>

            <div>
              <Label htmlFor="startDatum">Startdatum</Label>
              <Input
                id="startDatum"
                type="date"
                value={formData.startDatum}
                onChange={(e) => setFormData(prev => ({ ...prev, startDatum: e.target.value }))}
                className={errors.startDatum ? 'border-red-500' : ''}
              />
              {errors.startDatum && (
                <p className="text-sm text-red-600 mt-1">{errors.startDatum}</p>
              )}
            </div>

            {isEditing && (
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktiv">Aktiv</SelectItem>
                    <SelectItem value="beendet">Beendet</SelectItem>
                    <SelectItem value="vorzeitig_beendet">Vorzeitig beendet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {calculation && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Berechnete Erträge</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Zinserträge:</span>
                    <p className="font-semibold text-blue-800">
                      {formatCurrency(calculation.zinsbetrag)}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-600">Endbetrag:</span>
                    <p className="font-semibold text-blue-800">
                      {formatCurrency(calculation.endbetrag)}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-600">Monatliche Zinsen:</span>
                    <p className="font-semibold text-blue-800">
                      {formatCurrency(calculation.zinsbetrag / parseInt(formData.laufzeitMonate || '1'))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isEditing && formData.status !== 'aktiv' && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Änderungen an beendeten Anlagen werden automatisch Transaktionen erstellen.
              </AlertDescription>
            </Alert>
          )}
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
