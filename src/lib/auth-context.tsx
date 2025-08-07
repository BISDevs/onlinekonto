'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, LoginCredentials } from './types';
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  initializeStorage,
  apiLogin
} from './api-storage';

interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  resetData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize storage and check for existing session
    console.log('AuthProvider: Initializing with database...');

    // Only initialize once
    let isMounted = true;

    initializeStorage();

    if (isMounted) {
      const currentUser = getCurrentUser();
      console.log('AuthProvider: Current user from session:', currentUser);
      setUser(currentUser);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Login attempt with:', credentials.email);

      const result = await apiLogin(credentials);

      if (result.success && result.user) {
        setCurrentUser(result.user);
        setUser(result.user);
        console.log('Login successful for user:', result.user);
        return { success: true };
      } else {
        console.log('Login failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten' };
    }
  };



  const logout = () => {
    console.log('Logging out user');
    clearCurrentUser();
    setUser(null);
  };

  const resetData = () => {
    console.log('Resetting session data');
    clearCurrentUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isLoading,
      resetData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
