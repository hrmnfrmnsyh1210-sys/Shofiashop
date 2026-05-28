import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { api, ApiError } from './api';
import type { PublicStore } from './types';

type StoreState = {
  slug: string;
  store: PublicStore | null;
  loading: boolean;
  error: string | null;
  // helpers
  path: (rel: string) => string;
};

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { slug = '' } = useParams<{ slug: string }>();
  const [store, setStore] = useState<PublicStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setStore(null);
      setLoading(false);
      setError('Toko tidak ditemukan');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<PublicStore>(`/stores/${slug}`, { skipAuth: true })
      .then((s) => {
        if (!cancelled) setStore(s);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? 'Toko tidak ditemukan.'
            : err instanceof ApiError
            ? err.message
            : 'Gagal memuat toko',
        );
        setStore(null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const value = useMemo<StoreState>(
    () => ({
      slug,
      store,
      loading,
      error,
      path: (rel: string) => {
        const norm = rel.startsWith('/') ? rel.slice(1) : rel;
        return `/s/${slug}${norm ? `/${norm}` : ''}`;
      },
    }),
    [slug, store, loading, error],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
