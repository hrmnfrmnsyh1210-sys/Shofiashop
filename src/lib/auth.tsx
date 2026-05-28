import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, tokenStore } from './api';
import type { AuthResponse, User, UserRole } from './types';

type TenantContext = { id: string; name: string; slug: string } | null;

interface AuthState {
  user: User | null;
  tenant: TenantContext;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => tokenStore.getUser());
  const [tenant, setTenant] = useState<TenantContext>(() => tokenStore.getTenant());
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(tokenStore.getAccess()));

  const refreshMe = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setUser(null);
      setTenant(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.get<{ user: User; tenant: TenantContext }>('/auth/me');
      tokenStore.setUser(data.user);
      tokenStore.setTenant(data.tenant);
      setUser(data.user);
      setTenant(data.tenant);
    } catch {
      tokenStore.clear();
      setUser(null);
      setTenant(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    const handler = () => {
      setUser(null);
      setTenant(null);
    };
    window.addEventListener('compos:unauthorized', handler);
    return () => window.removeEventListener('compos:unauthorized', handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/login', { email, password }, { skipAuth: true });
    tokenStore.set(data);
    tokenStore.setTenant(data.tenant ?? null);
    setUser(data.user);
    setTenant(data.tenant ?? null);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefresh();
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken }, { skipAuth: true });
      } catch {
        // ignore
      }
    }
    tokenStore.clear();
    setUser(null);
    setTenant(null);
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => (user ? roles.includes(user.role) : false),
    [user],
  );

  const value = useMemo<AuthState>(
    () => ({ user, tenant, isLoading, login, logout, refreshMe, hasRole }),
    [user, tenant, isLoading, login, logout, refreshMe, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
