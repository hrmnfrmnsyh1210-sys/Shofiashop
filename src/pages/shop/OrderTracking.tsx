import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2, MapPin, PackageSearch, Truck } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useStore } from '../../lib/store';
import { rupiah, formatDateTime } from '../../lib/format';
import { TrackingTimeline } from '../../components/TrackingTimeline';
import type {
  CustomerOrderStatus,
  OnlineOrderStatus,
  TrackingInfo,
} from '../../lib/types';

const STAGES: { key: OnlineOrderStatus; label: string }[] = [
  { key: 'NEW', label: 'Pesanan Masuk' },
  { key: 'CONFIRMED', label: 'Dikonfirmasi' },
  { key: 'PROCESSING', label: 'Diproses' },
  { key: 'SHIPPED', label: 'Dikirim' },
  { key: 'COMPLETED', label: 'Selesai' },
];

export default function OrderTracking() {
  const { slug } = useStore();
  const [params] = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(params.get('order') ?? '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<CustomerOrderStatus | null>(null);

  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Prefill the order number from the confirmation page link.
  useEffect(() => {
    const o = params.get('order');
    if (o) setOrderNumber(o);
  }, [params]);

  const lookup = async (e: FormEvent) => {
    e.preventDefault();
    const num = orderNumber.trim();
    const ph = phone.trim();
    if (!num || !ph) {
      setError('Isi nomor pesanan dan no. HP Anda.');
      return;
    }
    setLoading(true);
    setError(null);
    setOrder(null);
    setTracking(null);
    setTrackingError(null);
    try {
      const res = await api.get<CustomerOrderStatus>(
        `/stores/${slug}/orders/${encodeURIComponent(num)}`,
        { query: { phone: ph }, skipAuth: true },
      );
      setOrder(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const loadTracking = async () => {
    if (!order) return;
    setTrackingLoading(true);
    setTrackingError(null);
    setTracking(null);
    try {
      const info = await api.get<TrackingInfo>(
        `/stores/${slug}/orders/${encodeURIComponent(order.orderNumber)}/tracking`,
        { query: { phone: phone.trim() }, skipAuth: true },
      );
      setTracking(info);
    } catch (err) {
      setTrackingError(err instanceof ApiError ? err.message : 'Gagal melacak pengiriman');
    } finally {
      setTrackingLoading(false);
    }
  };

  const cancelled = order?.onlineStatus === 'CANCELLED';
  const currentStageIdx = order
    ? STAGES.findIndex((s) => s.key === order.onlineStatus)
    : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <PackageSearch className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Lacak Pesanan</h1>
        <p className="text-slate-500 text-sm mt-1">
          Masukkan nomor pesanan dan no. HP yang Anda gunakan saat memesan.
        </p>
      </div>

      <form
        onSubmit={lookup}
        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
      >
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Nomor Pesanan</span>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="ORD-XXXXXX"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">No. HP</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
            inputMode="tel"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </label>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageSearch className="w-4 h-4" />}
          Lacak Pesanan
        </button>
      </form>

      {order && (
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Nomor Pesanan
              </div>
              <div className="font-mono font-bold text-slate-900">{order.orderNumber}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Total
              </div>
              <div className="font-bold text-rose-600">{rupiah(order.total)}</div>
            </div>
          </div>

          {/* Status stepper */}
          {cancelled ? (
            <div className="bg-slate-100 text-slate-600 text-sm font-semibold rounded-lg px-3 py-2 text-center">
              Pesanan ini dibatalkan.
            </div>
          ) : (
            <div className="flex items-center">
              {STAGES.map((s, i) => {
                const done = i <= currentStageIdx;
                return (
                  <div key={s.key} className="flex-1 flex flex-col items-center relative">
                    {i > 0 && (
                      <span
                        className={`absolute right-1/2 top-2.5 h-0.5 w-full -z-0 ${
                          i <= currentStageIdx ? 'bg-rose-400' : 'bg-slate-200'
                        }`}
                      />
                    )}
                    <span
                      className={`relative z-10 w-5 h-5 rounded-full border-2 border-white ring-1 ${
                        done ? 'bg-rose-500 ring-rose-500' : 'bg-slate-200 ring-slate-200'
                      }`}
                    />
                    <span
                      className={`mt-1.5 text-[10px] text-center leading-tight ${
                        done ? 'text-slate-700 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Shipping summary */}
          <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-4">
            <Info label="Tanggal Pesan" value={formatDateTime(order.createdAt)} />
            <Info
              label="Ekspedisi"
              value={
                order.shippingCourier
                  ? `${order.shippingCourier.toUpperCase()}${
                      order.shippingService ? ` - ${order.shippingService}` : ''
                    }`
                  : '-'
              }
            />
            {order.destinationCity && <Info label="Tujuan" value={order.destinationCity} />}
            {order.shippedAt && (
              <Info label="Dikirim" value={formatDateTime(order.shippedAt)} />
            )}
            {order.trackingNumber && (
              <Info label="No. Resi" value={order.trackingNumber} mono />
            )}
          </div>

          {/* Live tracking */}
          {order.hasTracking ? (
            <div className="border-t border-slate-100 pt-4">
              <button
                onClick={loadTracking}
                disabled={trackingLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold rounded-lg"
              >
                {trackingLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MapPin className="w-3.5 h-3.5" />
                )}
                Lihat Posisi Paket
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
          ) : (
            <div className="border-t border-slate-100 pt-4 text-xs text-slate-500 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" />
              {order.onlineStatus === 'CANCELLED'
                ? 'Pesanan dibatalkan.'
                : 'Paket belum dikirim. Nomor resi akan muncul di sini setelah pesanan dikirim.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">{label}</div>
      <div className={`text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
