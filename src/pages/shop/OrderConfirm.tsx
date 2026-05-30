import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Copy, PackageSearch } from 'lucide-react';
import { useState } from 'react';
import { rupiah } from '../../lib/format';
import { useStore } from '../../lib/store';
import { PaymentProofUpload } from '../../components/PaymentProofUpload';
import type { CheckoutResponse, PaymentMethod } from '../../lib/types';

export default function OrderConfirm() {
  const { orderNumber: paramOrderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const stateData = (location.state ?? null) as {
    order?: CheckoutResponse;
    total?: number;
    phone?: string;
    paymentMethod?: PaymentMethod;
    shipping?: { label: string; etd: string; cost: number; city: string | null } | null;
  } | null;
  const order = stateData?.order;
  const total = stateData?.total;
  const phone = stateData?.phone;
  const paymentMethod = stateData?.paymentMethod ?? 'TRANSFER';
  const shipping = stateData?.shipping ?? null;
  const orderNumber = order?.orderNumber ?? paramOrderNumber ?? '';
  const { store, slug, path } = useStore();

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Pesanan Berhasil Dibuat!
        </h1>
        <p className="text-slate-500 mb-8">
          Terima kasih sudah belanja di {store?.name ?? 'toko ini'}. Selesaikan pembayaran lalu
          unggah buktinya di bawah agar admin dapat mengonfirmasi pesanan Anda.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 text-left">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Nomor Pesanan
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono font-bold text-lg text-slate-900 truncate">{orderNumber}</span>
            <button
              onClick={copy}
              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold border border-slate-200 hover:bg-white rounded-md text-slate-600"
            >
              <Copy className="w-3 h-3" /> {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>

          {total !== undefined && (
            <>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4 mb-1">
                Total Bayar
              </div>
              <div className="font-bold text-lg text-rose-600">{rupiah(total)}</div>
            </>
          )}

          {order && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-slate-500 font-semibold uppercase tracking-wider">Status</div>
                <div className="text-slate-900 font-semibold">{order.status}</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold uppercase tracking-wider">Pengiriman</div>
                <div className="text-slate-900 font-semibold">{order.onlineStatus ?? '-'}</div>
              </div>
            </div>
          )}

          {shipping && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Ekspedisi
              </div>
              <div className="text-sm text-slate-900 font-semibold">
                {shipping.label}
                {shipping.city ? ` → ${shipping.city}` : ''}
              </div>
              <div className="text-xs text-slate-500">
                {rupiah(shipping.cost)}
                {shipping.etd ? ` • estimasi ${shipping.etd} hari` : ''}
              </div>
            </div>
          )}

          {store?.bankInfo && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Info Pembayaran
              </div>
              <div className="text-sm text-slate-700 whitespace-pre-line">{store.bankInfo}</div>
            </div>
          )}
        </div>

        {orderNumber && (
          <div className="mb-6 text-left">
            <PaymentProofUpload
              slug={slug}
              orderNumber={orderNumber}
              phone={phone}
              status={order?.status ?? 'PENDING'}
              paymentMethod={paymentMethod}
            />
          </div>
        )}

        <div className="space-y-2">
          <Link
            to={`${path('lacak')}?order=${encodeURIComponent(orderNumber)}`}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <PackageSearch className="w-4 h-4" /> Lacak Pesanan
          </Link>
          <Link
            to={path('')}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            Belanja Lagi <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Simpan nomor pesanan ini sebagai bukti. Anda bisa memeriksa status pesanan & pembayaran
          kapan saja di halaman Lacak Pesanan.
        </p>
      </div>
    </div>
  );
}
