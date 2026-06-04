import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { rupiah, rupiahShort, formatDate, toISODate } from '../../lib/format';
import { PageHeader } from '../../components/PageHeader';
import { AreaChart, DonutChart, Sparkline, BarRow } from '../../components/Charts';
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

  const series = daily?.series ?? [];
  const totalsArr = useMemo(() => series.map((p) => Number(p.total)), [series]);
  const countArr = useMemo(() => series.map((p) => p.count), [series]);

  /** Delta minggu-terakhir vs minggu-sebelumnya untuk tren stat-card. */
  const trend = useMemo(() => {
    if (series.length < 14) return { sales: 0, count: 0 };
    const last7 = series.slice(-7);
    const prev7 = series.slice(-14, -7);
    const sum = (arr: typeof series, key: 'total' | 'count') =>
      arr.reduce((s, p) => s + Number(p[key]), 0);
    const pct = (cur: number, prev: number) =>
      prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0;
    return {
      sales: pct(sum(last7, 'total'), sum(prev7, 'total')),
      count: pct(sum(last7, 'count'), sum(prev7, 'count')),
    };
  }, [series]);

  const margin = useMemo(() => {
    const total = Number(summary?.total ?? 0);
    const profit = Number(summary?.grossProfit ?? 0);
    return total > 0 ? (profit / total) * 100 : 0;
  }, [summary]);

  const profitSegments = useMemo(
    () => [
      { label: 'Laba Kotor', value: Number(summary?.grossProfit ?? 0), color: '#10b981' },
      { label: 'Modal (COGS)', value: Number(summary?.cogs ?? 0), color: '#f43f5e' },
    ],
    [summary],
  );

  const topMax = useMemo(
    () => Math.max(1, ...topProducts.map((t) => t.quantity)),
    [topProducts],
  );

  const fmtDay = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  if (!hasRole('ADMIN', 'MANAGER')) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        description={`Ringkasan 30 hari terakhir • ${formatDate(range.from)} — ${formatDate(range.to)}`}
      />

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
          spark={totalsArr}
          delta={isLoading ? undefined : trend.sales}
        />
        <StatCard
          label="Laba Kotor"
          value={isLoading ? '...' : rupiah(summary?.grossProfit)}
          icon={ArrowUpRight}
          color="emerald"
          caption={isLoading ? undefined : `Margin ${margin.toFixed(0)}%`}
        />
        <StatCard
          label="Jumlah Transaksi"
          value={isLoading ? '...' : String(summary?.transactionCount ?? 0)}
          icon={Receipt}
          color="blue"
          spark={countArr}
          delta={isLoading ? undefined : trend.count}
        />
        <StatCard
          label="COGS"
          value={isLoading ? '...' : rupiah(summary?.cogs)}
          icon={ShoppingBag}
          color="slate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily area chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Penjualan Harian</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tren omzet 30 hari terakhir</p>
            </div>
            <Link to="/admin/reports" className="text-xs text-rose-500 font-semibold hover:underline shrink-0">
              Detail laporan →
            </Link>
          </div>
          {isLoading ? (
            <div className="h-52 skeleton" />
          ) : series.length > 0 && totalsArr.some((v) => v > 0) ? (
            <AreaChart
              data={series.map((p) => ({ label: p.date, value: Number(p.total) }))}
              height={200}
              formatValue={(v) => rupiah(v)}
              formatLabel={fmtDay}
            />
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              Belum ada data penjualan.
            </div>
          )}
        </div>

        {/* Profit composition donut */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-900">Komposisi Omzet</h3>
          </div>
          {isLoading ? (
            <div className="h-44 skeleton" />
          ) : Number(summary?.total ?? 0) > 0 ? (
            <DonutChart
              segments={profitSegments}
              centerTitle="Margin"
              centerValue={`${margin.toFixed(0)}%`}
            />
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-400 text-sm text-center">
              Belum ada data untuk dihitung.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Top products */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 mb-6">Produk Terlaris</h3>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 skeleton" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="text-slate-400 text-sm">Belum ada penjualan.</div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((tp, i) => (
                <div key={tp.product?.id ?? i} className="flex items-center gap-3">
                  <div className="w-7 h-7 shrink-0 bg-rose-50 text-rose-600 rounded-md flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <BarRow
                      label={tp.product?.name ?? '(produk dihapus)'}
                      value={tp.quantity}
                      max={topMax}
                      caption={`${tp.quantity} terjual • ${rupiahShort(tp.revenue)}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900">Stok Menipis</h3>
              <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                {lowStock.length}
              </span>
            </div>
            <Link to="/admin/stock" className="text-xs text-rose-500 font-semibold hover:underline shrink-0">
              Atur →
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 skeleton" />
              ))}
            </div>
          ) : lowStock.length === 0 ? (
            <div className="text-slate-400 text-sm py-8 text-center">
              Tidak ada produk yang stoknya menipis. 🎉
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100 last:border-b-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                    <div className="text-xs text-slate-400 font-mono truncate">{p.sku}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-rose-600">{p.stock}</div>
                    <div className="text-[10px] text-slate-400">min {p.minStock}</div>
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
  spark?: number[];
  delta?: number;
  caption?: string;
}
function StatCard({ label, value, icon: Icon, color, spark, delta, caption }: StatCardProps) {
  const colorMap = {
    rose: { chip: 'bg-rose-50 text-rose-600', line: '#f43f5e' },
    emerald: { chip: 'bg-emerald-50 text-emerald-600', line: '#10b981' },
    blue: { chip: 'bg-blue-50 text-blue-600', line: '#3b82f6' },
    slate: { chip: 'bg-slate-100 text-slate-600', line: '#64748b' },
  };
  const c = colorMap[color];
  const showDelta = delta != null && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.chip}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{value}</div>
      <div className="flex items-center justify-between gap-2 mt-1.5 h-9">
        <div className="min-w-0">
          {showDelta ? (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                up ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(delta!).toFixed(0)}%
              <span className="text-slate-400 font-normal ml-0.5">vs minggu lalu</span>
            </span>
          ) : caption ? (
            <span className="text-xs text-slate-500 font-medium">{caption}</span>
          ) : null}
        </div>
        {spark && spark.length > 1 && (
          <div className="w-20 shrink-0">
            <Sparkline data={spark} color={c.line} height={32} />
          </div>
        )}
      </div>
    </div>
  );
}
