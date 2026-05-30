import { useEffect, useState } from 'react';
import { Eye, Ban, Loader2, X, Truck, MapPin, Save } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { PageHeader } from '../../components/PageHeader';
import { Modal } from '../../components/Modal';
import { TrackingTimeline } from '../../components/TrackingTimeline';
import { rupiah, formatDateTime } from '../../lib/format';
import type {
  OnlineOrderStatus,
  PaginatedResponse,
  TrackingInfo,
  Transaction,
  TransactionChannel,
  TransactionStatus,
} from '../../lib/types';

const PAGE_SIZE = 20;
const CHANNELS: TransactionChannel[] = ['POS', 'ONLINE'];
const STATUSES: TransactionStatus[] = ['PAID', 'PENDING', 'VOIDED', 'REFUNDED'];
const ONLINE_STATUSES: OnlineOrderStatus[] = [
  'NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED',
];

const statusColor: Record<TransactionStatus, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  VOIDED: 'bg-slate-100 text-slate-600',
  REFUNDED: 'bg-blue-50 text-blue-700',
};

export default function Transactions() {
  const { hasRole } = useAuth();
  const canVoid = hasRole('ADMIN', 'MANAGER');

  const [channel, setChannel] = useState<TransactionChannel | ''>('');
  const [status, setStatus] = useState<TransactionStatus | ''>('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<Transaction> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<Transaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // shipment tracking (resi) state, scoped to the open detail
  const [resiInput, setResiInput] = useState('');
  const [savingResi, setSavingResi] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [komshipEnabled, setKomshipEnabled] = useState(false);
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Detect whether automatic resi (Komship) is configured.
  useEffect(() => {
    let cancelled = false;
    api
      .get<{ komshipEnabled?: boolean }>('/shipping/enabled')
      .then((r) => !cancelled && setKomshipEnabled(Boolean(r.komshipEnabled)))
      .catch(() => !cancelled && setKomshipEnabled(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<PaginatedResponse<Transaction>>('/transactions', {
        query: { channel: channel || undefined, status: status || undefined, page, pageSize: PAGE_SIZE },
      });
      setData(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, status, page]);

  const openDetail = async (t: Transaction) => {
    setDetailLoading(true);
    setActionError(null);
    setTracking(null);
    setTrackingError(null);
    try {
      const full = await api.get<Transaction>(`/transactions/${t.id}`);
      setDetail(full);
      setResiInput(full.trackingNumber ?? '');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal memuat detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setTracking(null);
    setTrackingError(null);
    setResiInput('');
  };

  const saveTracking = async () => {
    if (!detail) return;
    const trackingNumber = resiInput.trim();
    if (trackingNumber.length < 3) {
      setActionError('Nomor resi tidak valid.');
      return;
    }
    setSavingResi(true);
    setActionError(null);
    try {
      const updated = await api.patch<Transaction>(
        `/transactions/${detail.id}/tracking`,
        { trackingNumber },
      );
      setDetail(updated);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Gagal menyimpan resi');
    } finally {
      setSavingResi(false);
    }
  };

  const createShipment = async () => {
    if (!detail) return;
    if (!confirm('Buat pengiriman & resi otomatis lewat Komship untuk pesanan ini?')) return;
    setCreatingShipment(true);
    setActionError(null);
    try {
      const updated = await api.post<Transaction>(`/transactions/${detail.id}/shipment`);
      setDetail(updated);
      setResiInput(updated.trackingNumber ?? '');
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Gagal membuat resi otomatis');
    } finally {
      setCreatingShipment(false);
    }
  };

  const loadTracking = async () => {
    if (!detail) return;
    setTrackingLoading(true);
    setTrackingError(null);
    setTracking(null);
    try {
      const info = await api.get<TrackingInfo>(`/transactions/${detail.id}/tracking`);
      setTracking(info);
    } catch (err) {
      setTrackingError(err instanceof ApiError ? err.message : 'Gagal melacak pengiriman');
    } finally {
      setTrackingLoading(false);
    }
  };

  const onVoid = async () => {
    if (!detail) return;
    if (!confirm(`Void transaksi ${detail.transactionNumber}? Stok akan dikembalikan.`)) return;
    setActionError(null);
    try {
      const updated = await api.post<Transaction>(`/transactions/${detail.id}/void`);
      setDetail(updated);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Gagal void transaksi');
    }
  };

  const updateOnlineStatus = async (next: OnlineOrderStatus) => {
    if (!detail) return;
    setActionError(null);
    try {
      const updated = await api.patch<Transaction>(`/transactions/${detail.id}/online-status`, { onlineStatus: next });
      setDetail(updated);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Gagal update status');
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Transaksi" description="Riwayat semua transaksi POS dan order online." />

      <div className="bg-white border border-slate-200 rounded-2xl">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-3">
          <select value={channel} onChange={(e) => { setChannel(e.target.value as TransactionChannel | ''); setPage(1); }} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option value="">Semua channel</option>
            {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value as TransactionStatus | ''); setPage(1); }} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option value="">Semua status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {error && <div className="m-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">{error}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold">No. Transaksi</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Channel</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Pelanggan</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Memuat...</td></tr>
              ) : !data || data.items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Belum ada transaksi.</td></tr>
              ) : (
                data.items.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">{t.transactionNumber}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(t.createdAt)}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">{t.channel}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded ${statusColor[t.status]}`}>{t.status}</span></td>
                    <td className="px-4 py-3 text-slate-700">{t.member?.name ?? t.customerName ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{rupiah(t.total)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openDetail(t)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded">
                        <Eye className="w-4 h-4" />
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
            <span className="text-slate-500">{data.total} transaksi • Hal {data.page} dari {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50">Sebelumnya</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50">Berikutnya</button>
            </div>
          </div>
        )}
      </div>

      {detailLoading && (
        <div className="fixed inset-0 bg-slate-900/30 z-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      )}

      <Modal open={!!detail} onClose={closeDetail} title={detail ? `Detail ${detail.transactionNumber}` : ''} size="lg">
        {detail && (
          <div className="space-y-4 text-sm">
            {actionError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md px-3 py-2 flex items-start gap-2">
                <X className="w-4 h-4 shrink-0 mt-0.5" /> {actionError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <Info label="Tanggal" value={formatDateTime(detail.createdAt)} />
              <Info label="Channel" value={detail.channel} />
              <Info label="Status" value={detail.status} />
              <Info label="Pembayaran" value={detail.paymentMethod} />
              <Info label="Kasir" value={detail.cashier?.name ?? '-'} />
              <Info label="Member" value={detail.member?.name ?? '-'} />
              {detail.channel === 'ONLINE' && (
                <>
                  <Info label="Customer" value={detail.customerName ?? '-'} />
                  <Info label="HP" value={detail.customerPhone ?? '-'} />
                  <Info label="Alamat" value={detail.shippingAddress ?? '-'} />
                  <Info label="Online Status" value={detail.onlineStatus ?? '-'} />
                  {detail.shippingCourier && (
                    <Info
                      label="Ekspedisi"
                      value={`${detail.shippingCourier}${
                        detail.shippingService ? ` - ${detail.shippingService}` : ''
                      }${detail.shippingEtd ? ` (${detail.shippingEtd} hari)` : ''}`}
                    />
                  )}
                  {detail.destinationCity && (
                    <Info label="Kota Tujuan" value={detail.destinationCity} />
                  )}
                </>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-2 font-semibold">Produk</th>
                    <th className="px-3 py-2 font-semibold text-right">Qty</th>
                    <th className="px-3 py-2 font-semibold text-right">Harga</th>
                    <th className="px-3 py-2 font-semibold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items?.map((it) => (
                    <tr key={it.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{it.productName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{it.sku}</div>
                      </td>
                      <td className="px-3 py-2 text-right">{it.quantity}</td>
                      <td className="px-3 py-2 text-right">{rupiah(it.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{rupiah(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-xs">
              <Row label="Subtotal" value={rupiah(detail.subtotal)} />
              <Row label="Diskon" value={`- ${rupiah(detail.discount)}`} />
              {Number(detail.tax) > 0 && <Row label="Pajak" value={rupiah(detail.tax)} />}
              {Number(detail.shippingFee) > 0 && <Row label="Ongkir" value={rupiah(detail.shippingFee)} />}
              <Row label="Total" value={rupiah(detail.total)} bold />
              <Row label="Dibayar" value={rupiah(detail.paymentAmount)} />
              <Row label="Kembalian" value={rupiah(detail.changeAmount)} />
            </div>

            {detail.channel === 'ONLINE' && (
              <div className="rounded-lg border border-slate-200 p-3 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Truck className="w-4 h-4 text-rose-500" /> Pengiriman & Pelacakan
                </div>

                {!detail.shippingCourier && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-md px-3 py-2">
                    Pesanan ini belum punya data kurir, jadi resi tidak bisa dibuat / dilacak otomatis.
                  </div>
                )}

                {/* Auto resi via Komship (one click), when configured */}
                {komshipEnabled && !detail.trackingNumber && detail.shippingCourier && (
                  <div>
                    <button
                      onClick={createShipment}
                      disabled={creatingShipment}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold rounded-lg"
                    >
                      {creatingShipment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                      Buat Resi Otomatis (Komship)
                    </button>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Membuat order Komship, menjadwalkan penjemputan kurir, dan menerbitkan resi otomatis.
                    </p>
                  </div>
                )}

                {detail.shipmentOrderNo && (
                  <div className="text-[11px] text-slate-500">
                    No. Order Komship: <span className="font-mono text-slate-700">{detail.shipmentOrderNo}</span>
                    {detail.labelUrl && (
                      <>
                        {' · '}
                        <a
                          href={detail.labelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-rose-600 font-semibold hover:underline"
                        >
                          Lihat label / live tracking
                        </a>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nomor Resi {detail.shippingCourier ? `(${detail.shippingCourier.toUpperCase()})` : ''}
                    {komshipEnabled && <span className="text-slate-400 font-normal"> — atau input manual</span>}
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={resiInput}
                      onChange={(e) => setResiInput(e.target.value)}
                      placeholder="Masukkan nomor resi pengiriman"
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      onClick={saveTracking}
                      disabled={savingResi || resiInput.trim() === (detail.trackingNumber ?? '')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg whitespace-nowrap"
                    >
                      {savingResi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Simpan
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Menyimpan resi otomatis mengubah status pesanan menjadi SHIPPED.
                    {detail.shippedAt && ` Dikirim ${formatDateTime(detail.shippedAt)}.`}
                  </p>
                </div>

                {detail.trackingNumber && detail.shippingCourier && (
                  <div>
                    <button
                      onClick={loadTracking}
                      disabled={trackingLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-60 text-rose-700 text-xs font-bold rounded-lg"
                    >
                      {trackingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                      Lacak Pengiriman
                    </button>

                    {trackingError && (
                      <div className="mt-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md px-3 py-2">
                        {trackingError}
                      </div>
                    )}

                    {tracking && (
                      <div className="mt-3">
                        <TrackingTimeline tracking={tracking} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              {detail.channel === 'ONLINE' ? (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700">Update status:</label>
                  <select
                    value={detail.onlineStatus ?? 'NEW'}
                    onChange={(e) => updateOnlineStatus(e.target.value as OnlineOrderStatus)}
                    className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {ONLINE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ) : <span />}

              {canVoid && detail.status !== 'VOIDED' && detail.status !== 'REFUNDED' && (
                <button onClick={onVoid} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg">
                  <Ban className="w-3.5 h-3.5" /> Void Transaksi
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-slate-500 font-semibold">{label}</div>
      <div className="text-slate-900">{value}</div>
    </div>
  );
}
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={bold ? 'font-bold text-slate-900' : 'text-slate-900'}>{value}</span>
    </div>
  );
}
