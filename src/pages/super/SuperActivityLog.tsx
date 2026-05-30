import { useEffect, useState, type ComponentType } from 'react';
import {
  Search,
  LogIn,
  Package,
  FolderTree,
  Users,
  Boxes,
  Receipt,
  UserCog,
  Store,
  Activity as ActivityIcon,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { PageHeader } from '../../components/PageHeader';
import { formatDateTime } from '../../lib/format';
import type { ActivityLog, PaginatedResponse, Tenant } from '../../lib/types';

const PAGE_SIZE = 25;

const FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Semua aktivitas' },
  { value: 'auth', label: 'Login' },
  { value: 'product', label: 'Produk' },
  { value: 'category', label: 'Kategori' },
  { value: 'member', label: 'Member' },
  { value: 'stock', label: 'Stok' },
  { value: 'transaction', label: 'Transaksi' },
  { value: 'user', label: 'Pengguna' },
  { value: 'tenant', label: 'Pengaturan' },
];

type Style = { icon: ComponentType<{ className?: string }>; color: string };

const STYLE_BY_PREFIX: Record<string, Style> = {
  auth: { icon: LogIn, color: 'bg-indigo-50 text-indigo-600' },
  product: { icon: Package, color: 'bg-rose-50 text-rose-600' },
  category: { icon: FolderTree, color: 'bg-amber-50 text-amber-600' },
  member: { icon: Users, color: 'bg-blue-50 text-blue-600' },
  stock: { icon: Boxes, color: 'bg-emerald-50 text-emerald-600' },
  transaction: { icon: Receipt, color: 'bg-purple-50 text-purple-600' },
  user: { icon: UserCog, color: 'bg-cyan-50 text-cyan-600' },
  tenant: { icon: Store, color: 'bg-slate-100 text-slate-600' },
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manajer',
  CASHIER: 'Kasir',
  SUPER_ADMIN: 'Super Admin',
};

function styleFor(action: string): Style {
  const prefix = action.split('.')[0];
  return STYLE_BY_PREFIX[prefix] ?? { icon: ActivityIcon, color: 'bg-slate-100 text-slate-600' };
}

export default function SuperActivityLog() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<ActivityLog> | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PaginatedResponse<Tenant>>('/super/tenants', { query: { page: 1, pageSize: 100 } })
      .then((r) => setTenants(r.items))
      .catch(() => setTenants([]));
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<PaginatedResponse<ActivityLog>>('/super/activity', {
        query: {
          search,
          action: filter || undefined,
          tenantId: tenantId || undefined,
          page,
          pageSize: PAGE_SIZE,
        },
      });
      setData(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat log aktivitas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter, tenantId, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Log Aktivitas"
        description="Jejak audit seluruh aktivitas penting di semua toko platform."
      />

      <div className="bg-white border border-slate-200 rounded-2xl">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari aktivitas atau pengguna..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <select
            value={tenantId}
            onChange={(e) => { setTenantId(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Semua toko</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        {error && <div className="m-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">{error}</div>}

        {loading ? (
          <div className="px-4 py-12 text-center text-slate-400 text-sm">Memuat...</div>
        ) : !data || data.items.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-400 text-sm">Belum ada aktivitas tercatat.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.items.map((a) => {
              const { icon: Icon, color } = styleFor(a.action);
              return (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/60">
                  <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-900">{a.summary}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                      <span className="font-medium text-slate-600">
                        {a.userName ?? a.userEmail ?? 'Sistem'}
                      </span>
                      {a.userRole && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {ROLE_LABEL[a.userRole] ?? a.userRole}
                        </span>
                      )}
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded">
                        {a.tenantName ?? 'Platform'}
                      </span>
                      <span>•</span>
                      <span>{formatDateTime(a.createdAt)}</span>
                    </div>
                  </div>
                  <span className="hidden sm:block text-[10px] font-mono text-slate-300 shrink-0 pt-1">{a.action}</span>
                </li>
              );
            })}
          </ul>
        )}

        {data && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm">
            <span className="text-slate-500">{data.total} aktivitas • Hal {data.page} dari {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50">Sebelumnya</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50">Berikutnya</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
