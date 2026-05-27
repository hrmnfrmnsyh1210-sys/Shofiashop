import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Plus, Search, Pencil, Coins, Loader2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { PageHeader } from '../../components/PageHeader';
import { Modal } from '../../components/Modal';
import { formatDate } from '../../lib/format';
import type { Member, PaginatedResponse } from '../../lib/types';

const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' };
const PAGE_SIZE = 20;

export default function Members() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<Member> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [pointsOpen, setPointsOpen] = useState<Member | null>(null);
  const [pointsDelta, setPointsDelta] = useState('');
  const [pointsSaving, setPointsSaving] = useState(false);
  const [pointsError, setPointsError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<PaginatedResponse<Member>>('/members', { query: { search, page, pageSize: PAGE_SIZE } });
      setData(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat member');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };
  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({
      name: m.name,
      phone: m.phone,
      email: m.email ?? '',
      address: m.address ?? '',
      notes: m.notes ?? '',
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
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editing) await api.patch(`/members/${editing.id}`, payload);
      else await api.post('/members', payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Gagal menyimpan member');
    } finally {
      setSaving(false);
    }
  };

  const submitPoints = async () => {
    if (!pointsOpen) return;
    const delta = Number(pointsDelta);
    if (!Number.isFinite(delta) || delta === 0) {
      setPointsError('Masukkan angka non-nol (boleh negatif)');
      return;
    }
    setPointsSaving(true);
    setPointsError(null);
    try {
      await api.post(`/members/${pointsOpen.id}/points`, { delta });
      setPointsOpen(null);
      setPointsDelta('');
      await load();
    } catch (err) {
      setPointsError(err instanceof ApiError ? err.message : 'Gagal menyesuaikan poin');
    } finally {
      setPointsSaving(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Member"
        description="Database pelanggan loyal dengan poin loyalti."
        actions={
          <button onClick={openCreate} className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Member Baru
          </button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-2xl">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama, no HP, atau email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {error && <div className="m-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">{error}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">No HP</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold text-right">Poin</th>
                <th className="px-4 py-3 font-semibold">Bergabung</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Memuat...</td></tr>
              ) : !data || data.items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Belum ada member.</td></tr>
              ) : (
                data.items.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-900">{m.name}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{m.phone}</td>
                    <td className="px-4 py-3 text-slate-600">{m.email ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600">{m.points.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(m.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setPointsOpen(m)} className="p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 rounded" title="Atur poin">
                          <Coins className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(m)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm">
            <span className="text-slate-500">{data.total} member • Hal {data.page} dari {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50">Sebelumnya</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50">Berikutnya</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Member' : 'Member Baru'}>
        <form onSubmit={onSubmit} className="space-y-3 text-sm">
          {formError && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md px-3 py-2">{formError}</div>}
          <Field label="Nama *">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="No HP *">
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="0812..." />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Alamat">
            <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Catatan">
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white text-sm font-bold rounded-lg flex items-center gap-1.5">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!pointsOpen} onClose={() => { setPointsOpen(null); setPointsDelta(''); setPointsError(null); }} title={`Atur Poin: ${pointsOpen?.name ?? ''}`}>
        {pointsOpen && (
          <div className="space-y-3 text-sm">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500">Poin sekarang</div>
              <div className="text-2xl font-bold text-rose-600">{pointsOpen.points.toLocaleString('id-ID')}</div>
            </div>
            <Field label="Penyesuaian (boleh negatif untuk kurangi)">
              <input type="number" value={pointsDelta} onChange={(e) => setPointsDelta(e.target.value)} className={inputCls} placeholder="+100 atau -50" />
            </Field>
            {pointsError && <div className="text-xs text-rose-600">{pointsError}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setPointsOpen(null); setPointsDelta(''); setPointsError(null); }} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
              <button onClick={submitPoints} disabled={pointsSaving} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white text-sm font-bold rounded-lg flex items-center gap-1.5">
                {pointsSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        )}
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
