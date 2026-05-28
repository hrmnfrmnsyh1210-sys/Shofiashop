import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { PageHeader } from '../../components/PageHeader';
import { fileToDataUrl, MAX_IMAGE_BYTES } from '../../lib/imageUpload';
import type { Tenant } from '../../lib/types';

type Form = {
  name: string;
  description: string;
  whatsapp: string;
  email: string;
  address: string;
  bankInfo: string;
  logoUrl: string;
};

const emptyForm: Form = {
  name: '',
  description: '',
  whatsapp: '',
  email: '',
  address: '',
  bankInfo: '',
  logoUrl: '',
};

export default function Settings() {
  const { hasRole, refreshMe } = useAuth();
  const canEdit = hasRole('ADMIN');

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shopUrl =
    typeof window !== 'undefined' && tenant
      ? `${window.location.origin}/s/${tenant.slug}`
      : '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<Tenant>('/admin/tenant')
      .then((t) => {
        if (cancelled) return;
        setTenant(t);
        setForm({
          name: t.name ?? '',
          description: t.description ?? '',
          whatsapp: t.whatsapp ?? '',
          email: t.email ?? '',
          address: t.address ?? '',
          bankInfo: t.bankInfo ?? '',
          logoUrl: t.logoUrl ?? '',
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Gagal memuat toko');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const onPickLogo = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((f) => ({ ...f, logoUrl: dataUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat gambar');
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        bankInfo: form.bankInfo.trim() || null,
        logoUrl: form.logoUrl || null,
      };
      const updated = await api.patch<Tenant>('/admin/tenant', payload);
      setTenant(updated);
      setSuccess('Pengaturan toko disimpan.');
      await refreshMe();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-slate-400">Memuat pengaturan toko...</div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Pengaturan Toko"
        description="Atur identitas dan kontak toko Anda. Tampil di halaman toko online."
      />

      {tenant && (
        <div className="mb-6 bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
            Subdomain toko Anda
          </div>
          <div className="font-mono text-slate-900 break-all">{shopUrl}</div>
          {tenant.customDomain && (
            <div className="mt-2 text-xs text-slate-600">
              Custom domain:{' '}
              <span className="font-mono text-slate-900">{tenant.customDomain}</span>
            </div>
          )}
          <div className="mt-2 text-xs text-slate-500">
            Slug subdomain (<span className="font-mono">{tenant.slug}</span>) dan custom domain
            hanya bisa diubah oleh Super Admin platform.
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 text-sm"
      >
        <fieldset disabled={!canEdit} className="space-y-4">
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              Logo Toko
            </span>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickLogo(e.target.files?.[0] ?? null)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <Upload className="w-3.5 h-3.5" /> Unggah logo
                  </button>
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, logoUrl: '' })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" /> Hapus
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  PNG/JPG, maks {Math.round(MAX_IMAGE_BYTES / 1024)} KB.
                </div>
              </div>
            </div>
          </div>

          <Field label="Nama Toko *">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="Deskripsi Singkat">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputCls}
              placeholder="Tampil di halaman toko online."
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="WhatsApp">
              <input
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className={inputCls}
                placeholder="6281234567890"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
                placeholder="hello@toko.com"
              />
            </Field>
          </div>

          <Field label="Alamat Toko">
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="Info Pembayaran (rekening, dll)">
            <textarea
              rows={3}
              value={form.bankInfo}
              onChange={(e) => setForm({ ...form, bankInfo: e.target.value })}
              className={inputCls}
              placeholder="BCA 1234567890 a/n Toko Saya"
            />
          </Field>
        </fieldset>

        {canEdit && (
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white text-sm font-bold rounded-lg flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan Pengaturan
            </button>
          </div>
        )}
      </form>
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
