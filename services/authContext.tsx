import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authRegister, authLogin, authMe, authVerifyEmail,
  authResendVerification, authForgotPassword, clearToken,
} from './db';
import { User, UserRole } from '../types';

/**
 * AUTH CONTEXT — Postgres-native authentication (Firebase removed).
 * The API issues a JWT on login; it's stored in localStorage by db.ts and
 * attached to every request. A logged-in user is, by definition, verified.
 */
interface AuthContextType {
  user: User | null;
  isEmailVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from a stored token on first load.
  useEffect(() => {
    (async () => {
      try {
        const profile = await authMe();
        setUser(profile);
      } catch (e) {
        console.error('Session restore failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const profile = await authLogin(email, password); // throws on bad creds / unverified
    setUser(profile);
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    // Creates the account and sends a verification email. Does NOT log in —
    // the user must verify before logging in.
    await authRegister(name, email, password, role);
  };

  const resetPassword = async (email: string) => {
    await authForgotPassword(email);
  };

  const verifyEmail = async (token: string) => {
    await authVerifyEmail(token);
  };

  const resendVerification = async (email: string) => {
    await authResendVerification(email);
  };

  const refreshUserProfile = async () => {
    const profile = await authMe();
    if (profile) setUser(profile);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isEmailVerified: !!user, // a logged-in user is always verified
      login,
      register,
      resetPassword,
      verifyEmail,
      resendVerification,
      logout,
      refreshUserProfile,
      loading,
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
