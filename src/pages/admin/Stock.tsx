import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle, RotateCcw, Settings2, Loader2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { PageHeader } from '../../components/PageHeader';
import { Modal } from '../../components/Modal';
import { formatDateTime } from '../../lib/format';
import type {
  PaginatedResponse,
  Product,
  StockMovement,
  StockMovementType,
} from '../../lib/types';

const PAGE_SIZE = 20;
const TYPES: Array<{ value: StockMovementType; label: string }> = [
  { value: 'IN', label: 'Masuk' },
  { value: 'OUT', label: 'Keluar' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'RETURN', label: 'Retur' },
];

const TypeBadge = ({ type }: { type: StockMovementType }) => {
  const map: Record<StockMovementType, { icon: typeof ArrowDownCircle; cls: string; label: string }> = {
    IN: { icon: ArrowDownCircle, cls: 'bg-emerald-50 text-emerald-700', label: 'Masuk' },
    OUT: { icon: ArrowUpCircle, cls: 'bg-rose-50 text-rose-700', label: 'Keluar' },
    ADJUSTMENT: { icon: Settings2, cls: 'bg-amber-50 text-amber-700', label: 'Adjust' },
    RETURN: { icon: RotateCcw, cls: 'bg-blue-50 text-blue-700', label: 'Retur' },
  };
  const { icon: Icon, cls, label } = map[type];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
};

export default function Stock() {
  const [typeFilter, setTypeFilter] = useState<StockMovementType | ''>('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<StockMovement> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ productId: '', type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT', quantity: '', reference: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<PaginatedResponse<StockMovement>>('/stock/movements', {
        query: { type: typeFilter || undefined, page, pageSize: PAGE_SIZE },
      });
      setData(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, page]);

  const openAdjust = async () => {
    setForm({ productId: '', type: 'IN', quantity: '', reference: '', note: '' });
    setFormError(null);
    setAdjustOpen(true);
    if (products.length === 0) {
      try {
        const r = await api.get<PaginatedResponse<Product>>('/products', { query: { pageSize: 100, sort: 'name', isActive: 'true' } });
        setProducts(r.items);
      } catch {
        // ignore — modal still usable but list empty
      }
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const qty = Number(form.quantity);
      if (!Number.isFinite(qty)) throw new Error('Jumlah tidak valid');
      await api.post('/stock/adjust', {
        productId: form.productId,
        type: form.type,
        quantity: qty,
        reference: form.reference.trim() || null,
        note: form.note.trim() || null,
      });
      setAdjustOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Stok"
        description="Pergerakan stok dari semua sumber (kasir, retur, adjustment manual)."
        actions={
          <button onClick={openAdjust} className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Adjustment Stok
          </button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-2xl">
        <div className="p-4 border-b border-slate-200">
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as StockMovementType | ''); setPage(1); }} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option value="">Semua tipe</option>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {error && <div className="m-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">{error}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Produk</th>
                <th className="px-4 py-3 font-semibold">Tipe</th>
                <th className="px-4 py-3 font-semibold text-right">Qty</th>
                <th className="px-4 py-3 font-semibold text-right">Sebelum</th>
                <th className="px-4 py-3 font-semibold text-right">Sesudah</th>
                <th className="px-4 py-3 font-semibold">Referensi</th>
                <th className="px-4 py-3 font-semibold">Oleh</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">Memuat...</td></tr>
              ) : !data || data.items.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">Belum ada pergerakan stok.</td></tr>
              ) : (
                data.items.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDateTime(m.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{m.product?.name ?? '-'}</div>
                      <div className="text-xs text-slate-400 font-mono">{m.product?.sku}</div>
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={m.type} /></td>
                    <td className="px-4 py-3 text-right font-bold">{m.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{m.stockBefore}</td>
                    <td className="px-4 py-3 text-right text-slate-900 font-semibold">{m.stockAfter}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{m.reference ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{m.user?.name ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm">
            <span className="text-slate-500">{data.total} entri • Hal {data.page} dari {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50">Sebelumnya</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50">Berikutnya</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={adjustOpen} onClose={() => setAdjustOpen(false)} title="Adjustment Stok">
        <form onSubmit={onSubmit} className="space-y-3 text-sm">
          {formError && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md px-3 py-2">{formError}</div>}
          <Field label="Produk *">
            <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className={inputCls}>
              <option value="">— Pilih produk —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (stok: {p.stock})</option>
              ))}
            </select>
          </Field>
          <Field label="Tipe *">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'IN' | 'OUT' | 'ADJUSTMENT' })} className={inputCls}>
              <option value="IN">Masuk (tambah stok)</option>
              <option value="OUT">Keluar (kurang stok)</option>
              <option value="ADJUSTMENT">Adjustment (set stok absolut)</option>
            </select>
          </Field>
          <Field label={form.type === 'ADJUSTMENT' ? 'Stok target *' : 'Jumlah *'}>
            <input required type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Referensi (PO/SO/note)">
            <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className={inputCls} placeholder="PO-001" />
          </Field>
          <Field label="Catatan">
            <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputCls} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setAdjustOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white text-sm font-bold rounded-lg flex items-center gap-1.5">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
