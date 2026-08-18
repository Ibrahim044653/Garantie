'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/types';
import { authApi } from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  canEdit: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadUser = useCallback(async () => {
    try {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      // Optimistically restore from localStorage first (instant UX)
      const cached = localStorage.getItem('user');
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          // ignore malformed cache
        }
      }
      setIsLoading(false);

      // Then silently validate against the server in the background
      authApi.me()
        .then((res) => {
          const fresh = res.data.user ?? res.data;
          setUser(fresh);
          localStorage.setItem('user', JSON.stringify(fresh));
        })
        .catch(() => {
          // Only invalidate if not a network error — keep user logged in
          // when backend is temporarily unreachable
        });
    } catch {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token, user: loggedUser } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    }
  };

  const hasRole = (...roles: UserRole[]) =>
    user !== null && roles.includes(user.role);

  // RESPONSABLE_RISQUES can view but not edit
  const canEdit = () =>
    user !== null && user.role !== 'RESPONSABLE_RISQUES';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        hasRole,
        canEdit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
