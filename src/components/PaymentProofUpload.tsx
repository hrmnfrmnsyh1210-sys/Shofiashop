import { useRef, useState } from 'react';
import { CheckCircle2, Clock, Loader2, Upload, AlertCircle } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { fileToDataUrl } from '../lib/imageUpload';
import { formatDateTime } from '../lib/format';
import type { CustomerOrderStatus, PaymentMethod, TransactionStatus } from '../lib/types';

const PROOF_MAX_BYTES = 1024 * 1024; // 1 MB raw

type Props = {
  slug: string;
  orderNumber: string;
  /** Prefilled buyer phone (used as the ownership check). If omitted, a field is shown. */
  phone?: string;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string | null;
  paymentProofAt?: string | null;
  paymentConfirmedAt?: string | null;
  /** Called with the refreshed order status after a successful upload. */
  onUpdated?: (order: CustomerOrderStatus) => void;
};

export function PaymentProofUpload({
  slug,
  orderNumber,
  phone: phoneProp,
  status,
  paymentMethod,
  paymentProofUrl = null,
  paymentProofAt = null,
  paymentConfirmedAt = null,
  onUpdated,
}: Props) {
  // Local copies so the section reflects an upload without a full reload.
  const [curStatus, setCurStatus] = useState<TransactionStatus>(status);
  const [proofUrl, setProofUrl] = useState<string | null>(paymentProofUrl);
  const [proofAt, setProofAt] = useState<string | null>(paymentProofAt);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(paymentConfirmedAt);

  const [phone, setPhone] = useState(phoneProp ?? '');
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // COD orders are paid on delivery — no proof needed.
  if (paymentMethod === 'CASH') {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Pesanan ini dibayar di tempat (COD). Tidak perlu mengunggah bukti pembayaran.
      </div>
    );
  }

  if (curStatus === 'VOIDED' || curStatus === 'REFUNDED') {
    return null;
  }

  const onPick = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file, { maxBytes: PROOF_MAX_BYTES });
      setPreview(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membaca gambar');
    }
  };

  const submit = async () => {
    if (!preview) {
      setError('Pilih gambar bukti pembayaran dulu.');
      return;
    }
    const ph = phone.trim();
    if (!ph) {
      setError('Masukkan no. HP yang Anda gunakan saat memesan.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await api.post<CustomerOrderStatus>(
        `/stores/${slug}/orders/${encodeURIComponent(orderNumber)}/payment-proof`,
        { phone: ph, image: preview },
        { skipAuth: true },
      );
      setCurStatus(updated.status);
      setProofUrl(updated.paymentProofUrl);
      setProofAt(updated.paymentProofAt);
      setConfirmedAt(updated.paymentConfirmedAt);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      onUpdated?.(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengirim bukti pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  // Payment already verified by admin.
  if (curStatus === 'PAID') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="w-4 h-4" /> Pembayaran sudah dikonfirmasi
        </div>
        {confirmedAt && (
          <div className="mt-1 text-xs text-emerald-600">
            Dikonfirmasi {formatDateTime(confirmedAt)}.
          </div>
        )}
        {proofUrl && (
          <a href={proofUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block">
            <img
              src={proofUrl}
              alt="Bukti pembayaran"
              className="h-20 w-20 rounded-lg border border-emerald-200 object-cover"
            />
          </a>
        )}
      </div>
    );
  }

  const showPhoneField = !phoneProp;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 space-y-3">
      <div className="text-sm font-bold text-slate-900">Konfirmasi Pembayaran</div>

      {proofUrl ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Clock className="w-4 h-4" /> Menunggu konfirmasi admin
          </div>
          <p className="mt-1 text-xs text-amber-700/80">
            Bukti pembayaran Anda sudah terkirim
            {proofAt ? ` (${formatDateTime(proofAt)})` : ''}. Admin akan memeriksa dan
            mengonfirmasi pembayaran Anda.
          </p>
          <a href={proofUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block">
            <img
              src={proofUrl}
              alt="Bukti pembayaran"
              className="h-20 w-20 rounded-lg border border-amber-200 object-cover"
            />
          </a>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Sudah transfer? Unggah bukti pembayaran (screenshot/foto struk) di sini agar admin
          dapat mengonfirmasi pesanan Anda.
        </p>
      )}

      {showPhoneField && (
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">No. HP Pemesan</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
            inputMode="tel"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </label>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
      />

      {preview && (
        <img
          src={preview}
          alt="Pratinjau bukti"
          className="h-28 w-28 rounded-lg border border-slate-200 object-cover"
        />
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={submitting || !preview}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 font-bold text-white hover:bg-rose-600 disabled:bg-rose-300"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {proofUrl ? 'Kirim Ulang Bukti' : 'Kirim Bukti Pembayaran'}
      </button>
    </div>
  );
}
