import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { api, ApiError } from '../../lib/api';
import { rupiah, toISODate, formatDate } from '../../lib/format';
import type {
  DailySalesResponse,
  LowStockItem,
  ReportSummary,
  TopProduct,
} from '../../lib/types';

const presets = [
  { label: '7 hari', days: 6 },
  { label: '30 hari', days: 29 },
  { label: '90 hari', days: 89 },
];

export default function Reports() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return toISODate(d);
  });
  const [to, setTo] = useState(() => toISODate(new Date()));

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [top, setTop] = useState<TopProduct[]>([]);
  const [daily, setDaily] = useState<DailySalesResponse | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, t, d, l] = await Promise.all([
        api.get<ReportSummary>('/reports/summary', { query: { from, to } }),
        api.get<TopProduct[]>('/reports/top-products', { query: { from, to, limit: 10 } }),
        api.get<DailySalesResponse>('/reports/daily-sales', { query: { from, to } }),
        api.get<LowStockItem[]>('/reports/low-stock'),
      ]);
      setSummary(s);
      setTop(t);
      setDaily(d);
      setLowStock(l);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const applyPreset = (days: number) => {
    const t = new Date();
    const f = new Date();
    f.setDate(f.getDate() - days);
    setFrom(toISODate(f));
    setTo(toISODate(t));
  };

  const maxTotal = useMemo(() => {
    if (!daily?.series.length) return 1;
    return Math.max(1, ...daily.series.map((p) => Number(p.total)));
  }, [daily]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Laporan"
        description="Performa penjualan, profitabilitas, dan inventori."
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {presets.map((p) => (
            <button key={p.label} onClick={() => applyPreset(p.days)} className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md">
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
          <span className="text-slate-400">→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
        </div>
        <span className="text-xs text-slate-500 ml-auto">
          {formatDate(from)} — {formatDate(to)}
        </span>
      </div>

      {error && <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Transaksi" value={loading ? '...' : String(summary?.transactionCount ?? 0)} />
        <Stat label="Total Penjualan" value={loading ? '...' : rupiah(summary?.total)} />
        <Stat label="COGS" value={loading ? '...' : rupiah(summary?.cogs)} />
        <Stat label="Laba Kotor" value={loading ? '...' : rupiah(summary?.grossProfit)} accent />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h3 className="font-bold text-slate-900 mb-6">Penjualan Harian</h3>
        {loading ? (
          <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Memuat...</div>
        ) : daily && daily.series.length > 0 ? (
          <div className="h-56 flex items-end gap-1">
            {daily.series.map((p) => {
              const h = (Number(p.total) / maxTotal) * 100;
              return (
                <div key={p.date} className="flex-1 group relative">
                  <div className="bg-rose-200 hover:bg-rose-500 rounded-t transition-colors" style={{ height: `${Math.max(2, h)}%` }} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    {p.date}: {rupiah(p.total)} ({p.count})
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Tidak ada data.</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 mb-4">Top 10 Produk Terlaris</h3>
          {loading ? <div className="text-slate-400 text-sm">Memuat...</div> : top.length === 0 ? (
            <div className="text-slate-400 text-sm">Belum ada data.</div>
          ) : (
            <div className="space-y-2">
              {top.map((tp, i) => (
                <div key={tp.product?.id ?? i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-b-0">
                  <div className="w-7 h-7 shrink-0 bg-rose-50 text-rose-600 rounded-md flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{tp.product?.name ?? '(produk dihapus)'}</div>
                    <div className="text-xs text-slate-500">{tp.quantity} terjual</div>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{rupiah(tp.revenue)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 mb-4">Stok Menipis ({lowStock.length})</h3>
          {loading ? <div className="text-slate-400 text-sm">Memuat...</div> : lowStock.length === 0 ? (
            <div className="text-slate-400 text-sm">Semua produk aman.</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{p.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-rose-600">{p.stock}</div>
                    <div className="text-xs text-slate-500">min {p.minStock}</div>
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${accent ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-xl sm:text-2xl font-bold truncate ${accent ? 'text-rose-600' : 'text-slate-900'}`}>{value}</div>
    </div>
  );
}
