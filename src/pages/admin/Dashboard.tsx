import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { rupiah, formatDate, toISODate } from '../../lib/format';
import { PageHeader } from '../../components/PageHeader';
import type {
  ReportSummary,
  TopProduct,
  DailySalesResponse,
  LowStockItem,
} from '../../lib/types';

export default function Dashboard() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasRole('ADMIN', 'MANAGER')) {
      navigate('/admin/pos', { replace: true });
    }
  }, [hasRole, navigate]);

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [daily, setDaily] = useState<DailySalesResponse | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);
    return { from: toISODate(from), to: toISODate(to) };
  }, []);

  useEffect(() => {
    if (!hasRole('ADMIN', 'MANAGER')) return;
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      api.get<ReportSummary>('/reports/summary', { query: { from: range.from, to: range.to } }),
      api.get<TopProduct[]>('/reports/top-products', { query: { from: range.from, to: range.to, limit: 5 } }),
      api.get<DailySalesResponse>('/reports/daily-sales', { query: { from: range.from, to: range.to } }),
      api.get<LowStockItem[]>('/reports/low-stock'),
    ])
      .then(([s, t, d, l]) => {
        if (cancelled) return;
        setSummary(s);
        setTopProducts(t);
        setDaily(d);
        setLowStock(l);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? 'Gagal memuat data');
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range, hasRole]);

  const maxTotal = useMemo(() => {
    if (!daily?.series.length) return 1;
    return Math.max(1, ...daily.series.map((p) => Number(p.total)));
  }, [daily]);

  if (!hasRole('ADMIN', 'MANAGER')) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Dashboard" description={`Ringkasan 30 hari terakhir • ${formatDate(range.from)} — ${formatDate(range.to)}`} />

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Penjualan"
          value={isLoading ? '...' : rupiah(summary?.total)}
          icon={TrendingUp}
          color="rose"
        />
        <StatCard
          label="Laba Kotor"
          value={isLoading ? '...' : rupiah(summary?.grossProfit)}
          icon={ArrowUpRight}
          color="emerald"
        />
        <StatCard
          label="Jumlah Transaksi"
          value={isLoading ? '...' : String(summary?.transactionCount ?? 0)}
          icon={Receipt}
          color="blue"
        />
        <StatCard
          label="COGS"
          value={isLoading ? '...' : rupiah(summary?.cogs)}
          icon={ShoppingBag}
          color="slate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Penjualan Harian</h3>
            <Link to="/admin/reports" className="text-xs text-rose-500 font-semibold hover:underline">
              Detail laporan →
            </Link>
          </div>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Memuat...</div>
          ) : daily && daily.series.length > 0 ? (
            <div className="h-48 flex items-end gap-1">
              {daily.series.map((p) => {
                const h = (Number(p.total) / maxTotal) * 100;
                return (
                  <div key={p.date} className="flex-1 group relative">
                    <div
                      className="bg-rose-200 hover:bg-rose-500 rounded-t transition-colors"
                      style={{ height: `${Math.max(2, h)}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {p.date}: {rupiah(p.total)} ({p.count})
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Belum ada data.</div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 mb-6">Produk Terlaris</h3>
          {isLoading ? (
            <div className="text-slate-400 text-sm">Memuat...</div>
          ) : topProducts.length === 0 ? (
            <div className="text-slate-400 text-sm">Belum ada penjualan.</div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((tp, i) => (
                <div key={tp.product?.id ?? i} className="flex items-center gap-3">
                  <div className="w-7 h-7 shrink-0 bg-rose-50 text-rose-600 rounded-md flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {tp.product?.name ?? '(produk dihapus)'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {tp.quantity} terjual • {rupiah(tp.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low stock */}
      <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900">Stok Menipis</h3>
            <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
              {lowStock.length}
            </span>
          </div>
          <Link to="/admin/stock" className="text-xs text-rose-500 font-semibold hover:underline">
            Atur stok →
          </Link>
        </div>
        {isLoading ? (
          <div className="text-slate-400 text-sm">Memuat...</div>
        ) : lowStock.length === 0 ? (
          <div className="text-slate-400 text-sm">Tidak ada produk yang stoknya menipis. 🎉</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="py-2 font-semibold">Produk</th>
                  <th className="py-2 font-semibold">SKU</th>
                  <th className="py-2 font-semibold text-right">Stok</th>
                  <th className="py-2 font-semibold text-right">Min</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-2.5 font-medium text-slate-900">{p.name}</td>
                    <td className="py-2.5 text-slate-500 font-mono text-xs">{p.sku}</td>
                    <td className="py-2.5 text-right font-bold text-rose-600">{p.stock}</td>
                    <td className="py-2.5 text-right text-slate-500">{p.minStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
