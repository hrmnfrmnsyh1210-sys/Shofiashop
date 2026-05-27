import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { PageHeader } from '../../components/PageHeader';
import { Modal } from '../../components/Modal';
import type { Category, PaginatedResponse } from '../../lib/types';

const emptyForm = { name: '', slug: '', description: '', isActive: true };

export default function Categories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<PaginatedResponse<Category>>('/categories', { query: { pageSize: 100 } });
      setItems(r.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '', isActive: c.isActive });
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
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      };
      if (editing) await api.patch(`/categories/${editing.id}`, payload);
      else await api.post('/categories', payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Gagal menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (c: Category) => {
    if (!confirm(`Nonaktifkan kategori "${c.name}"?`)) return;
    try {
      await api.delete(`/categories/${c.id}`);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus kategori');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Kategori"
        description="Kelompokkan produk supaya mudah ditemukan di POS dan toko online."
        actions={
          <button onClick={openCreate} className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Kategori Baru
          </button>
        }
      />

      {error && <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Deskripsi</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Belum ada kategori.</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-md truncate">{c.description ?? '-'}</td>
                  <td className="px-4 py-3">
                    {c.isActive ? (
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Aktif</span>
                    ) : (
                      <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">Nonaktif</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(c)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Kategori' : 'Kategori Baru'}>
        <form onSubmit={onSubmit} className="space-y-3 text-sm">
          {formError && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md px-3 py-2">{formError}</div>}
          <Field label="Nama *">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Slug (opsional, otomatis dari nama)">
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} placeholder="otomatis" />
          </Field>
          <Field label="Deskripsi">
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
          </Field>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            <span>Aktif</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
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
