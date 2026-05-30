import { useEffect, useRef, useState, type FormEvent, type ReactNode, type InputHTMLAttributes } from 'react';
import { Plus, Search, Pencil, Trash2, AlertCircle, Loader2, Upload, Image as ImageIcon, X, Tag, Wallet, Eye } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { rupiah } from '../../lib/format';
import { PageHeader } from '../../components/PageHeader';
import { Modal } from '../../components/Modal';
import { Loading } from '../../components/Spinner';
import { fileToDataUrl, MAX_IMAGE_BYTES } from '../../lib/imageUpload';
import type { Category, PaginatedResponse, Product } from '../../lib/types';

const PAGE_SIZE = 20;

type FormState = {
  name: string;
  sku: string;
  barcode: string;
  price: string;
  costPrice: string;
  stock: string;
  minStock: string;
  unit: string;
  categoryId: string;
  description: string;
  imageUrl: string;
  showOnline: boolean;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: '',
  sku: '',
  barcode: '',
  price: '',
  costPrice: '0',
  stock: '0',
  minStock: '0',
  unit: 'pcs',
  categoryId: '',
  description: '',
  imageUrl: '',
  showOnline: true,
  isActive: true,
};

export default function Products() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMIN', 'MANAGER');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onPickImage = async (file: File | null) => {
    if (!file) return;
    setFormError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((f) => ({ ...f, imageUrl: dataUrl }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal memuat gambar');
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<PaginatedResponse<Product>>('/products', {
        query: { search, page, pageSize: PAGE_SIZE, sort: 'name' },
      });
      setData(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  useEffect(() => {
    api
      .get<PaginatedResponse<Category>>('/categories', { query: { pageSize: 100 } })
      .then((r) => setCategories(r.items))
      .catch(() => setCategories([]));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode ?? '',
      price: String(p.price),
      costPrice: String(p.costPrice),
      stock: String(p.stock),
      minStock: String(p.minStock),
      unit: p.unit,
      categoryId: p.categoryId ?? '',
      description: p.description ?? '',
      imageUrl: p.imageUrl ?? '',
      showOnline: p.showOnline,
      isActive: p.isActive,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        barcode: form.barcode.trim() || null,
        price: Number(form.price) || 0,
        costPrice: Number(form.costPrice) || 0,
        stock: Number(form.stock) || 0,
        minStock: Number(form.minStock) || 0,
        unit: form.unit.trim() || 'pcs',
        categoryId: form.categoryId || null,
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        showOnline: form.showOnline,
        isActive: form.isActive,
      };
      if (editing) {
        await api.patch<Product>(`/products/${editing.id}`, payload);
      } else {
        await api.post<Product>('/products', payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Gagal menyimpan produk');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p: Product) => {
    if (!confirm(`Nonaktifkan produk "${p.name}"?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus produk');
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Produk"
        description="Kelola katalog produk yang dijual di POS dan toko online."
        actions={
          canEdit && (
            <button
              onClick={openCreate}
              className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Produk Baru
            </button>
          )
        }
      />

      <div className="bg-white border border-slate-200 rounded-2xl">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, SKU, atau barcode..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {error && (
          <div className="m-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold">Produk</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold text-right">Harga</th>
                <th className="px-4 py-3 font-semibold text-right">Stok</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                {canEdit && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4"><Loading label="Memuat produk..." /></td></tr>
              ) : !data || data.items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Belum ada produk.</td></tr>
              ) : (
                data.items.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      {p.barcode && <div className="text-xs text-slate-400 font-mono">{p.barcode}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 text-slate-600">{p.category?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{rupiah(p.price)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${p.stock <= p.minStock ? 'text-rose-600' : 'text-slate-900'}`}>
                      {p.stock} <span className="text-xs text-slate-400 font-normal">{p.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      {p.isActive ? (
                        <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Aktif</span>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">Nonaktif</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDelete(p)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              {data.total} produk • Hal {data.page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Produk' : 'Produk Baru'}
        description={editing ? 'Perbarui detail produk ini.' : 'Lengkapi detail untuk menambah produk baru.'}
        size="lg"
      >
        <form onSubmit={onSubmit} className="text-sm">
          {formError && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
            </div>
          )}

          <div className="space-y-5">
            <Section title="Informasi Dasar" icon={<Tag className="w-3.5 h-3.5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Field label="Nama Produk *">
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="cth. Kaos Polos Hitam" />
                  </Field>
                </div>
                <Field label="SKU *">
                  <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputCls} placeholder="cth. KP-HTM-01" />
                </Field>
                <Field label="Barcode">
                  <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className={inputCls} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Kategori">
                    <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
                      <option value="">— Tanpa kategori —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </Section>

            <Section title="Harga & Stok" icon={<Wallet className="w-3.5 h-3.5" />}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="Harga Jual *">
                  <PrefixInput required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </Field>
                <Field label="Harga Modal">
                  <PrefixInput type="number" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
                </Field>
                <Field label="Satuan">
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Stok Awal">
                  <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Stok Minimum">
                  <input type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className={inputCls} />
                </Field>
              </div>
            </Section>

            <Section title="Gambar & Deskripsi" icon={<ImageIcon className="w-3.5 h-3.5" />}>
              <div className="flex items-start gap-3">
                <div className="w-24 h-24 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" /> Unggah gambar
                    </button>
                    {form.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, imageUrl: '' })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Hapus
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className={`${inputCls} text-xs`}
                    placeholder="atau tempel URL gambar (https://...)"
                  />
                  <div className="text-[11px] text-slate-400">
                    PNG/JPG/WEBP, maks {Math.round(MAX_IMAGE_BYTES / 1024)} KB. Disimpan sebagai data toko.
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <Field label="Deskripsi">
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={inputCls}
                    placeholder="Jelaskan produk: bahan, ukuran, manfaat, dll. Tampil di halaman produk."
                  />
                </Field>
              </div>
            </Section>

            <Section title="Visibilitas" icon={<Eye className="w-3.5 h-3.5" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Toggle
                  label="Aktif"
                  hint="Bisa dijual di POS"
                  checked={form.isActive}
                  onChange={(v) => setForm({ ...form, isActive: v })}
                />
                <Toggle
                  label="Tampil di Toko Online"
                  hint="Muncul di katalog online"
                  checked={form.showOnline}
                  onChange={(v) => setForm({ ...form, showOnline: v })}
                />
              </div>
            </Section>
          </div>

          <div className="flex justify-end gap-2 pt-4 mt-5 border-t border-slate-200 sticky bottom-0 bg-white">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Batal
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white text-sm font-bold rounded-lg flex items-center gap-1.5 transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-shadow';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Number input with a "Rp" prefix. */
function PrefixInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">Rp</span>
      <input {...props} className={`${inputCls} pl-8`} />
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
        checked ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
      </span>
      <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-rose-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}
