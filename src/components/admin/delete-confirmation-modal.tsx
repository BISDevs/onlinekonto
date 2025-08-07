'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  itemName: string;
  confirmationText?: string;
  isDestructive?: boolean;
  additionalWarnings?: string[];
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  confirmationText,
  isDestructive = true,
  additionalWarnings = [],
}: DeleteConfirmationModalProps) {
  const [confirmInput, setConfirmInput] = useState('');
  const [loading, setLoading] = useState(false);

  const expectedConfirmation = confirmationText || itemName;
  const canDelete = confirmInput === expectedConfirmation;

  const handleConfirm = async () => {
    if (!canDelete) return;

    setLoading(true);
    try {
      await onConfirm();
      handleClose();
    } catch (error) {
      console.error('Delete operation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmInput('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              isDestructive ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                isDestructive ? 'text-red-600' : 'text-yellow-600'
              }`} />
            </div>
            <div>
              <DialogTitle className={isDestructive ? 'text-red-900' : 'text-yellow-900'}>
                {title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="mt-3">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {additionalWarnings.length > 0 && (
            <Alert className={`${
              isDestructive ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
            }`}>
              <AlertTriangle className={`h-4 w-4 ${
                isDestructive ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <AlertDescription className={isDestructive ? 'text-red-800' : 'text-yellow-800'}>
                <ul className="list-disc list-inside space-y-1">
                  {additionalWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Geben Sie <span className="font-mono font-semibold">{expectedConfirmation}</span> ein, um zu bestätigen:
            </Label>
            <Input
              id="confirmation"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={expectedConfirmation}
              className={confirmInput && !canDelete ? 'border-red-500' : ''}
              autoComplete="off"
            />
            {confirmInput && !canDelete && (
              <p className="text-sm text-red-600">
                Eingabe stimmt nicht überein
              </p>
            )}
          </div>

          <Alert className={`${
            isDestructive ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <AlertDescription className={isDestructive ? 'text-red-800' : 'text-gray-800'}>
              <strong>Diese Aktion kann nicht rückgängig gemacht werden.</strong>
              {isDestructive && ' Alle zugehörigen Daten werden unwiderruflich gelöscht.'}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Abbrechen
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={!canDelete || loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {loading ? 'Wird gelöscht...' : 'Endgültig löschen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
