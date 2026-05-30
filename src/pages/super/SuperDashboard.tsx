import { useEffect, useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { Store, Users, Package, Receipt, Activity as ActivityIcon, Clock } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { PageHeader } from '../../components/PageHeader';
import { rupiah, formatDateTime } from '../../lib/format';
import type { ActivityLog, PaginatedResponse, SuperOverview } from '../../lib/types';

const STATUS_BADGE: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-600',
  PENDING: 'bg-amber-50 text-amber-600',
  VOIDED: 'bg-slate-100 text-slate-500',
  REFUNDED: 'bg-rose-50 text-rose-600',
};

export default function SuperDashboard() {
  const [overview, setOverview] = useState<SuperOverview | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get<SuperOverview>('/super/overview'),
      api.get<PaginatedResponse<ActivityLog>>('/super/activity', { query: { page: 1, pageSize: 8 } }),
    ])
      .then(([o, a]) => {
        if (cancelled) return;
        setOverview(o);
        setActivity(a.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Gagal memuat data');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Dashboard" description="Ringkasan seluruh platform." />

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Toko Aktif"
          value={loading ? '...' : `${overview?.tenants.active ?? 0} / ${overview?.tenants.total ?? 0}`}
          icon={Store}
          color="rose"
        />
        <StatCard label="Total Pengguna" value={loading ? '...' : String(overview?.users.total ?? 0)} icon={Users} color="blue" />
        <StatCard label="Total Produk" value={loading ? '...' : String(overview?.products.total ?? 0)} icon={Package} color="emerald" />
        <StatCard label="Transaksi Terbaru" value={loading ? '...' : String(overview?.recentTransactions.length ?? 0)} icon={Receipt} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-500" />
              <h3 className="font-bold text-slate-900">Transaksi Terbaru</h3>
            </div>
            <Link to="/super/tenants" className="text-xs text-rose-500 font-semibold hover:underline">Kelola toko →</Link>
          </div>
          {loading ? (
            <div className="text-slate-400 text-sm">Memuat...</div>
          ) : !overview || overview.recentTransactions.length === 0 ? (
            <div className="text-slate-400 text-sm">Belum ada transaksi.</div>
          ) : (
            <div className="space-y-2">
              {overview.recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 py-1.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 font-mono truncate">{t.transactionNumber}</div>
                    <div className="text-xs text-slate-500">{t.tenantName ?? 'Toko dihapus'} • {formatDateTime(t.createdAt)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-900">{rupiah(t.total)}</div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_BADGE[t.status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-slate-900">Aktivitas Terbaru</h3>
            </div>
            <Link to="/super/activity" className="text-xs text-rose-500 font-semibold hover:underline">Lihat log →</Link>
          </div>
          {loading ? (
            <div className="text-slate-400 text-sm">Memuat...</div>
          ) : activity.length === 0 ? (
            <div className="text-slate-400 text-sm">Belum ada aktivitas.</div>
          ) : (
            <div className="space-y-3">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <Clock className="w-3.5 h-3.5 text-slate-300 mt-1 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm text-slate-900 truncate">{a.summary}</div>
                    <div className="text-xs text-slate-500">
                      {(a.userName ?? a.userEmail ?? 'Sistem')} • {a.tenantName ?? 'Platform'} • {formatDateTime(a.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  color: 'rose' | 'emerald' | 'blue' | 'slate';
}
function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colorMap = {
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{value}</div>
    </div>
  );
}
