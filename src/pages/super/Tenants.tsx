import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, ExternalLink, Loader2, Pencil, Plus, Power, Search, Store } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { PageHeader } from '../../components/PageHeader';
import { Modal } from '../../components/Modal';
import type { PaginatedResponse, Tenant } from '../../lib/types';

const PAGE_SIZE = 20;

type Form = {
  name: string;
  slug: string;
  customDomain: string;
  description: string;
  whatsapp: string;
  email: string;
  address: string;
  isActive: boolean;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

const empty: Form = {
  name: '',
  slug: '',
  customDomain: '',
  description: '',
  whatsapp: '',
  email: '',
  address: '',
  isActive: true,
  adminName: '',
  adminEmail: '',
  adminPassword: '',
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function Tenants() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<Tenant> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Tenant | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<PaginatedResponse<Tenant>>('/super/tenants', {
        query: { search, page, pageSize: PAGE_SIZE },
      });
      setData(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat tenant');
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
    setForm(empty);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setEditing(t);
    setForm({
      name: t.name,
      slug: t.slug,
      customDomain: t.customDomain ?? '',
      description: t.description ?? '',
      whatsapp: t.whatsapp ?? '',
      email: t.email ?? '',
      address: t.address ?? '',
      isActive: t.isActive,
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    });
    setFormError(null);
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const base = {
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        customDomain: form.customDomain.trim() || null,
        description: form.description.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        isActive: form.isActive,
      };
      if (editing) {
        await api.patch(`/super/tenants/${editing.id}`, base);
      } else {
        const payload = {
          ...base,
          ...(form.adminEmail && form.adminPassword
            ? {
                adminName: form.adminName.trim() || `Admin ${form.name}`,
                adminEmail: form.adminEmail.trim().toLowerCase(),
                adminPassword: form.adminPassword,
              }
            : {}),
        };
        await api.post('/super/tenants', payload);
      }
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t: Tenant) => {
    const next = !t.isActive;
    if (!confirm(`${next ? 'Aktifkan' : 'Nonaktifkan'} toko "${t.name}"?`)) return;
    try {
      await api.patch(`/super/tenants/${t.id}`, { isActive: next });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal mengubah status');
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Toko Berlangganan"
        description="Kelola semua toko yang menggunakan platform ComPos."
        actions={
          <button
            onClick={openCreate}
            className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Toko Baru
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama atau slug..."
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
                <th className="px-4 py-3 font-semibold">Toko</th>
                <th className="px-4 py-3 font-semibold">Slug / Domain</th>
                <th className="px-4 py-3 font-semibold text-right">Produk</th>
                <th className="px-4 py-3 font-semibold text-right">User</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Memuat...</td></tr>
              ) : !data || data.items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Belum ada toko.</td></tr>
              ) : (
                data.items.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                          {t.logoUrl ? (
                            <img src={t.logoUrl} alt={t.name} className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{t.name}</div>
                          {t.email && (
                            <div className="text-xs text-slate-400">{t.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-700">/s/{t.slug}</div>
                      {t.customDomain && (
                        <div className="font-mono text-xs text-slate-400">{t.customDomain}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{t._count?.products ?? 0}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{t._count?.users ?? 0}</td>
                    <td className="px-4 py-3">
                      {t.isActive ? (
                        <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Aktif</span>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">Nonaktif</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <a
                          href={`/s/${t.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded"
                          title="Buka toko"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(t)}
                          className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded"
                          title={t.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          <Power className="w-4 h-4" />
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
            <span className="text-slate-500">
              {data.total} toko • Hal {data.page} dari {totalPages}
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
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit Toko: ${editing.name}` : 'Toko Baru'}
        size="lg"
      >
        <form onSubmit={onSubmit} className="space-y-3 text-sm">
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md px-3 py-2">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Nama Toko *">
              <input
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editing ? f.slug : slugify(name),
                  }));
                }}
                className={inputCls}
              />
            </Field>
            <Field label="Slug Subdomain *">
              <div className="flex items-center gap-1">
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  className={inputCls}
                  placeholder="tokomu"
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                URL toko: <span className="font-mono">/s/{form.slug || '...'}</span>
              </div>
            </Field>
            <Field label="Custom Domain (opsional)">
              <input
                value={form.customDomain}
                onChange={(e) => setForm({ ...form, customDomain: e.target.value.trim().toLowerCase() })}
                className={inputCls}
                placeholder="toko.com"
              />
            </Field>
            <Field label="WhatsApp">
              <input
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className={inputCls}
                placeholder="6281234567890"
              />
            </Field>
            <Field label="Email Toko">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Alamat">
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Deskripsi">
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputCls}
            />
          </Field>

          {!editing && (
            <div className="border-t border-slate-100 pt-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Admin awal toko (opsional)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Nama">
                  <input
                    value={form.adminName}
                    onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Password">
                  <input
                    type="text"
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                    className={inputCls}
                    placeholder="min 8 karakter"
                  />
                </Field>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Kosongkan untuk membuat toko tanpa admin awal — bisa ditambahkan nanti.
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm pt-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <span>Toko aktif</span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white text-sm font-bold rounded-lg flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Simpan Perubahan' : 'Buat Toko'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
