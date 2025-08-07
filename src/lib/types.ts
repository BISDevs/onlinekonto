import { User as PrismaUser, FestgeldAnlage as PrismaFestgeldAnlage, Transaktion as PrismaTransaktion } from '@prisma/client';

export interface User {
  id: string; // Changed to string for alphanumeric IDs
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';

  // Banking Information
  accountNumber: string;
  kycStatus: 'pending' | 'verified' | 'rejected' | 'incomplete';

  // Address Information
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;

  // Reference Account
  referenceIban?: string;
  referenceBic?: string;
  referenceBankName?: string;

  created_at: string;
  updated_at: string;
}

export interface FestgeldAnlage {
  id: number;
  user_id: string; // Changed to string to match User.id
  betrag: number;
  zinssatz: number;
  laufzeit_monate: number;
  start_datum: string;
  end_datum: string;
  zinsbetrag: number;
  endbetrag: number;
  status: 'aktiv' | 'beendet' | 'vorzeitig_beendet';
  created_at: string;
  updated_at: string;
}

export interface Transaktion {
  id: number;
  anlage_id?: number;
  user_id: string; // Changed to string to match User.id
  typ: 'einzahlung' | 'auszahlung' | 'zinsgutschrift';
  betrag: number;
  datum: string;
  beschreibung?: string;
}

// Database type mappers
export type DbUser = PrismaUser;
export type DbFestgeldAnlage = PrismaFestgeldAnlage;
export type DbTransaktion = PrismaTransaktion;

export interface AuthUser {
  id: string; // Changed to string for alphanumeric IDs
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}
