import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Plus, Search, Pencil, Loader2, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { PageHeader } from '../../components/PageHeader';
import { Modal } from '../../components/Modal';
import { formatDate } from '../../lib/format';
import type { PaginatedResponse, StaffUser, UserRole } from '../../lib/types';

const PAGE_SIZE = 20;
const ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'CASHIER'];

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manajer',
  CASHIER: 'Kasir',
  SUPER_ADMIN: 'Super Admin',
};

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-rose-50 text-rose-600',
  MANAGER: 'bg-blue-50 text-blue-600',
  CASHIER: 'bg-slate-100 text-slate-600',
  SUPER_ADMIN: 'bg-amber-50 text-amber-600',
};

type Form = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
};

const emptyForm: Form = { name: '', email: '', password: '', role: 'CASHIER', isActive: true };

export default function Staff() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<StaffUser> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<PaginatedResponse<StaffUser>>('/admin/users', {
        query: { search, page, pageSize: PAGE_SIZE },
      });
      setData(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat pengguna');
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
  const openEdit = (u: StaffUser) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive });
    setFormError(null);
    setModalOpen(true);
  };

  const isSelf = editing && me ? editing.id === me.id : false;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          name: form.name.trim(),
          role: form.role,
          isActive: form.isActive,
        };
        if (form.password.trim()) payload.password = form.password.trim();
        await api.patch(`/admin/users/${editing.id}`, payload);
      } else {
        await api.post('/admin/users', {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Gagal menyimpan pengguna');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Pengguna & Staf"
        description="Kelola akun admin, manajer, dan kasir toko Anda."
        actions={
          <button onClick={openCreate} className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Tambah Pengguna
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
              placeholder="Cari nama atau email..."
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
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Dibuat</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Memuat...</td></tr>
              ) : !data || data.items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Belum ada pengguna.</td></tr>
              ) : (
                data.items.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {u.name}
                      {me?.id === u.id && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">(Anda)</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${ROLE_BADGE[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Aktif</span>
                      ) : (
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Nonaktif</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm">
            <span className="text-slate-500">{data.total} pengguna • Hal {data.page} dari {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50">Sebelumnya</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50">Berikutnya</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Pengguna' : 'Pengguna Baru'}>
        <form onSubmit={onSubmit} className="space-y-3 text-sm">
          {formError && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md px-3 py-2">{formError}</div>}
          <Field label="Nama *">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Email *">
            <input
              required
              type="email"
              value={form.email}
              disabled={!!editing}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`${inputCls} ${editing ? 'bg-slate-50 text-slate-500' : ''}`}
            />
          </Field>
          {editing && (
            <p className="text-[11px] text-slate-400 -mt-1">Email tidak dapat diubah setelah dibuat.</p>
          )}
          <Field label={editing ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}>
            <input
              type="password"
              required={!editing}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputCls}
              placeholder={editing ? '••••••••' : 'Minimal 8 karakter'}
              minLength={8}
            />
          </Field>
          <Field label="Role *">
            <select
              value={form.role}
              disabled={isSelf}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className={`${inputCls} ${isSelf ? 'bg-slate-50 text-slate-500' : ''}`}
            >
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </Field>
          {editing && (
            <label className={`flex items-center gap-2 ${isSelf ? 'opacity-50' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={form.isActive}
                disabled={isSelf}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-rose-500"
              />
              <span className="text-sm font-medium text-slate-700">Akun aktif</span>
            </label>
          )}
          {isSelf && (
            <p className="text-[11px] text-amber-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Role & status akun sendiri tidak dapat diubah.
            </p>
          )}
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
