import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../../core/domain/models/User';
import { IAuthRepository } from '../../core/domain/repositories/IAuthRepository';
import { AuthError } from '../../core/domain/models/AuthError';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Auth provider component encapsulating authentication logic
 */
export const AuthProvider: React.FC<{
  children: React.ReactNode;
  authRepository: IAuthRepository;
}> = ({ children, authRepository }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const currentUser = await authRepository.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError({
          code: 'auth/initialization-error',
          message: 'Failed to initialize authentication'
        });
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [authRepository]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const user = await authRepository.login(email, password);
      setUser(user);
    } catch (err: any) {
      setError({
        code: err.code || 'auth/unknown',
        message: err.message
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      setError(null);
      const user = await authRepository.register(email, password, displayName);
      setUser(user);
    } catch (err: any) {
      setError({
        code: err.code || 'auth/unknown',
        message: err.message
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authRepository.logout();
      setUser(null);
    } catch (err: any) {
      setError({
        code: err.code || 'auth/unknown',
        message: err.message
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      await authRepository.resetPassword(email);
    } catch (err: any) {
      setError({
        code: err.code || 'auth/unknown',
        message: err.message
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};