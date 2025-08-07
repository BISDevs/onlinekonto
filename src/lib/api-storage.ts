import { User, FestgeldAnlage, Transaktion, AuthUser, LoginCredentials } from './types';

// Base API configuration
const API_BASE = '/api';

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Ein Fehler ist aufgetreten' };
    }

    return { data };
  } catch (error) {
    console.error('API call error:', error);
    return { error: 'Netzwerkfehler' };
  }
}

// Authentication functions
export async function apiLogin(credentials: LoginCredentials): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const result = await apiCall<{ user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, user: result.data?.user };
}



// User management functions
export async function apiGetUsers(): Promise<User[]> {
  const result = await apiCall<User[]>('/users');
  return result.data || [];
}

export async function apiCreateUser(userData: {
  name: string;
  email: string;
  role?: string;
  accountNumber?: string;
  kycStatus?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  referenceIban?: string;
  referenceBic?: string;
  referenceBankName?: string;
}): Promise<User | null> {
  const result = await apiCall<User>('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  return result.data || null;
}

export async function apiGetUserById(id: string): Promise<User | null> {
  const result = await apiCall<User>(`/users/${id}`);
  return result.data || null;
}

export async function apiUpdateUser(id: string, userData: {
  name?: string;
  email?: string;
  role?: string;
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
}): Promise<User | null> {
  const result = await apiCall<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
  return result.data || null;
}

export async function apiDeleteUser(id: string): Promise<boolean> {
  const result = await apiCall<{ message: string }>(`/users/${id}`, {
    method: 'DELETE',
  });
  return !!result.data;
}

export async function apiGetUserByEmail(email: string): Promise<User | null> {
  const users = await apiGetUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
}

// Anlagen management functions
export async function apiGetAnlagen(): Promise<FestgeldAnlage[]> {
  const result = await apiCall<FestgeldAnlage[]>('/anlagen');
  return result.data || [];
}

export async function apiGetAnlagenByUser(userId: string): Promise<FestgeldAnlage[]> {
  const result = await apiCall<FestgeldAnlage[]>(`/anlagen?userId=${userId}`);
  return result.data || [];
}

export async function apiGetAnlageById(id: number): Promise<FestgeldAnlage | null> {
  const result = await apiCall<FestgeldAnlage>(`/anlagen/${id}`);
  return result.data || null;
}

export async function apiCreateAnlage(anlageData: {
  userId: string;
  betrag: number;
  zinssatz: number;
  laufzeitMonate: number;
  startDatum: string;
}): Promise<FestgeldAnlage | null> {
  const result = await apiCall<FestgeldAnlage>('/anlagen', {
    method: 'POST',
    body: JSON.stringify(anlageData),
  });
  return result.data || null;
}

export async function apiUpdateAnlage(id: number, anlageData: {
  betrag?: number;
  zinssatz?: number;
  laufzeitMonate?: number;
  startDatum?: string;
  status?: string;
}): Promise<FestgeldAnlage | null> {
  const result = await apiCall<FestgeldAnlage>(`/anlagen/${id}`, {
    method: 'PUT',
    body: JSON.stringify(anlageData),
  });
  return result.data || null;
}

export async function apiDeleteAnlage(id: number): Promise<boolean> {
  const result = await apiCall<{ message: string }>(`/anlagen/${id}`, {
    method: 'DELETE',
  });
  return !!result.data;
}

// Transaktionen management functions
export async function apiGetTransaktionen(): Promise<Transaktion[]> {
  const result = await apiCall<Transaktion[]>('/transaktionen');
  return result.data || [];
}

export async function apiGetTransaktionenByUser(userId: string, limit?: number): Promise<Transaktion[]> {
  const url = `/transaktionen?userId=${userId}${limit ? `&limit=${limit}` : ''}`;
  const result = await apiCall<Transaktion[]>(url);
  return result.data || [];
}

export async function apiCreateTransaktion(transaktionData: {
  anlageId?: number;
  userId: string;
  typ: string;
  betrag: number;
  beschreibung?: string;
}): Promise<Transaktion | null> {
  const result = await apiCall<Transaktion>('/transaktionen', {
    method: 'POST',
    body: JSON.stringify(transaktionData),
  });
  return result.data || null;
}

// Interest calculation utility (same as before)
export const calculateInterest = (
  betrag: number,
  zinssatz: number,
  laufzeitMonate: number
): { zinsbetrag: number; endbetrag: number } => {
  const zinsbetrag = (betrag * zinssatz * laufzeitMonate) / (100 * 12);
  const endbetrag = betrag + zinsbetrag;

  return {
    zinsbetrag: Math.round(zinsbetrag * 100) / 100,
    endbetrag: Math.round(endbetrag * 100) / 100
  };
};

// Session management (localStorage-based for client-side)
const SESSION_KEY = 'onlinekonto_session';

export const setCurrentUser = (user: AuthUser) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
};

export const getCurrentUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
};

export const clearCurrentUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
};

// Initialize function (no longer needed for database)
export const initializeStorage = () => {
  console.log('Using database storage - no initialization required');
};
