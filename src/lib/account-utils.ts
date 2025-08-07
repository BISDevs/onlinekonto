/**
 * Utility functions for account management
 */

// Generate alphanumeric account number
export function generateAccountNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  const timestamp = Date.now().toString().slice(-3);

  return `OK-${year}-${randomSuffix}${timestamp}`;
}

// Format KYC status for display
export function formatKycStatus(status: string): { label: string; color: string } {
  switch (status.toLowerCase()) {
    case 'verified':
      return { label: 'Verifiziert', color: 'text-green-600' };
    case 'pending':
      return { label: 'Ausstehend', color: 'text-yellow-600' };
    case 'rejected':
      return { label: 'Abgelehnt', color: 'text-red-600' };
    case 'incomplete':
      return { label: 'Unvollständig', color: 'text-gray-600' };
    default:
      return { label: 'Unbekannt', color: 'text-gray-600' };
  }
}

// Format IBAN for display (show only last 4 digits)
export function formatIbanForDisplay(iban?: string): string {
  if (!iban) return 'Nicht hinterlegt';
  if (iban.length < 4) return iban;

  const maskedPart = '*'.repeat(iban.length - 4);
  const lastFour = iban.slice(-4);

  return `${maskedPart}${lastFour}`;
}

// Validate IBAN format (basic validation)
export function validateIban(iban: string): boolean {
  if (!iban) return false;

  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();

  // Basic format check (2 letters + 2 digits + up to 30 alphanumeric)
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;

  return ibanRegex.test(cleanIban);
}

// Format address for display
export function formatAddress(user: {
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
}): string {
  const parts: string[] = [];

  if (user.street) parts.push(user.street);
  if (user.postalCode && user.city) {
    parts.push(`${user.postalCode} ${user.city}`);
  } else if (user.city) {
    parts.push(user.city);
  }
  if (user.country && user.country !== 'Deutschland') {
    parts.push(user.country);
  }

  return parts.length > 0 ? parts.join(', ') : 'Nicht hinterlegt';
}

// Get countries list for dropdown
export function getCountriesList(): { value: string; label: string }[] {
  return [
    { value: 'Deutschland', label: 'Deutschland' },
    { value: 'Österreich', label: 'Österreich' },
    { value: 'Schweiz', label: 'Schweiz' },
    { value: 'Niederlande', label: 'Niederlande' },
    { value: 'Belgien', label: 'Belgien' },
    { value: 'Frankreich', label: 'Frankreich' },
    { value: 'Italien', label: 'Italien' },
    { value: 'Spanien', label: 'Spanien' },
    { value: 'Polen', label: 'Polen' },
    { value: 'Tschechien', label: 'Tschechien' },
    { value: 'Andere', label: 'Andere' }
  ];
}

// Get KYC status options for dropdown
export function getKycStatusOptions(): { value: string; label: string; description: string }[] {
  return [
    {
      value: 'pending',
      label: 'Ausstehend',
      description: 'Verifizierung wurde eingereicht und wird geprüft'
    },
    {
      value: 'verified',
      label: 'Verifiziert',
      description: 'Identität wurde erfolgreich bestätigt'
    },
    {
      value: 'rejected',
      label: 'Abgelehnt',
      description: 'Verifizierung wurde abgelehnt'
    },
    {
      value: 'incomplete',
      label: 'Unvollständig',
      description: 'Weitere Dokumente erforderlich'
    }
  ];
}
