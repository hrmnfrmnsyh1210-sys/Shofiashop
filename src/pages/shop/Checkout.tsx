import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, Loader2, AlertCircle, Truck } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { rupiah } from '../../lib/format';
import { useStore } from '../../lib/store';
import type {
  CheckoutResponse,
  ShippingCity,
  ShippingOption,
  ShippingProvince,
} from '../../lib/types';

type PayMethod = 'TRANSFER' | 'EWALLET' | 'QRIS' | 'CASH' | 'OTHER';

const PAY_METHODS: { value: PayMethod; label: string; hint: string }[] = [
  { value: 'TRANSFER', label: 'Transfer Bank', hint: 'BCA / BNI / Mandiri' },
  { value: 'QRIS', label: 'QRIS', hint: 'Scan QR untuk bayar' },
  { value: 'EWALLET', label: 'E-Wallet', hint: 'OVO / DANA / GoPay' },
  { value: 'CASH', label: 'COD / Tunai', hint: 'Bayar saat barang sampai' },
];

const optionKey = (o: ShippingOption) => `${o.courier}|${o.service}`;

export default function Checkout() {
  const { lines, subtotal, clear, itemCount } = useCart();
  const navigate = useNavigate();
  const { slug, path } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('TRANSFER');
  const [notes, setNotes] = useState('');

  // --- Shipping / ekspedisi ---
  const [shippingEnabled, setShippingEnabled] = useState<boolean | null>(null);
  const [provinces, setProvinces] = useState<ShippingProvince[]>([]);
  const [provinceId, setProvinceId] = useState('');
  const [cities, setCities] = useState<ShippingCity[]>([]);
  const [cityId, setCityId] = useState('');
  const [loadingCities, setLoadingCities] = useState(false);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [loadingCost, setLoadingCost] = useState(false);
  const [costError, setCostError] = useState<string | null>(null);
  // fallback manual fee when the shipping API is disabled
  const [manualFee, setManualFee] = useState('15000');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist customer form locally (UX)
  useEffect(() => {
    const raw = localStorage.getItem('compos.shopCheckout');
    if (raw) {
      try {
        const v = JSON.parse(raw);
        setCustomerName(v.customerName ?? '');
        setCustomerPhone(v.customerPhone ?? '');
        setShippingAddress(v.shippingAddress ?? '');
        if (v.provinceId) setProvinceId(v.provinceId);
      } catch {
        // ignore
      }
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(
      'compos.shopCheckout',
      JSON.stringify({ customerName, customerPhone, shippingAddress, provinceId }),
    );
  }, [customerName, customerPhone, shippingAddress, provinceId]);

  // Detect whether the store has the ongkir API configured, then load provinces.
  useEffect(() => {
    let cancelled = false;
    api
      .get<{ enabled: boolean }>('/shipping/enabled', { skipAuth: true })
      .then((r) => {
        if (cancelled) return;
        setShippingEnabled(r.enabled);
        if (r.enabled) {
          api
            .get<ShippingProvince[]>('/shipping/provinces', { skipAuth: true })
            .then((p) => !cancelled && setProvinces(p))
            .catch(() => !cancelled && setProvinces([]));
        }
      })
      .catch(() => !cancelled && setShippingEnabled(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Load cities when a province is selected.
  useEffect(() => {
    if (!provinceId) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoadingCities(true);
    setCityId('');
    setOptions([]);
    setSelectedKey('');
    api
      .get<ShippingCity[]>('/shipping/cities', {
        query: { provinceId },
        skipAuth: true,
      })
      .then((c) => !cancelled && setCities(c))
      .catch(() => !cancelled && setCities([]))
      .finally(() => !cancelled && setLoadingCities(false));
    return () => {
      cancelled = true;
    };
  }, [provinceId]);

  // Fetch ongkir options when a destination city is selected.
  useEffect(() => {
    if (!cityId || lines.length === 0) {
      setOptions([]);
      setSelectedKey('');
      return;
    }
    let cancelled = false;
    setLoadingCost(true);
    setCostError(null);
    setOptions([]);
    setSelectedKey('');
    api
      .post<ShippingOption[]>(
        `/stores/${slug}/shipping/cost`,
        {
          destinationCityId: cityId,
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        },
        { skipAuth: true },
      )
      .then((opts) => {
        if (cancelled) return;
        setOptions(opts);
        if (opts.length > 0) setSelectedKey(optionKey(opts[0]));
      })
      .catch((err) => {
        if (!cancelled)
          setCostError(err instanceof ApiError ? err.message : 'Gagal menghitung ongkir');
      })
      .finally(() => !cancelled && setLoadingCost(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId, slug]);

  if (lines.length === 0) {
    return <Navigate to={path('cart')} replace />;
  }

  const selectedOption = options.find((o) => optionKey(o) === selectedKey) ?? null;
  const selectedCity = cities.find((c) => c.id === cityId) ?? null;
  const apiMode = shippingEnabled === true;

  const shippingFeeN = apiMode
    ? selectedOption?.cost ?? 0
    : Math.max(0, Number(manualFee) || 0);
  const total = subtotal + shippingFeeN;

  // In API mode the customer must pick a courier before ordering.
  const shippingReady = apiMode ? !!selectedOption : true;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (apiMode && !selectedOption) {
      setError('Silakan pilih kota tujuan dan layanan pengiriman terlebih dahulu.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<CheckoutResponse>(
        `/stores/${slug}/checkout`,
        {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          shippingAddress: shippingAddress.trim(),
          paymentMethod,
          shippingFee: shippingFeeN,
          shippingCourier: selectedOption
            ? `${selectedOption.courierName} (${selectedOption.courier.toUpperCase()})`
            : null,
          shippingService: selectedOption?.service ?? null,
          shippingEtd: selectedOption?.etd || null,
          destinationCity: selectedCity?.name ?? null,
          notes: notes.trim() || null,
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        },
        { skipAuth: true },
      );
      clear();
      navigate(path(`order/${res.orderNumber}`), {
        state: {
          order: res,
          total,
          shipping: selectedOption
            ? {
                label: `${selectedOption.courier.toUpperCase()} ${selectedOption.service}`,
                etd: selectedOption.etd,
                cost: shippingFeeN,
                city: selectedCity?.name ?? null,
              }
            : null,
        },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memproses pesanan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to={path('cart')} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4">
        <ChevronLeft className="w-4 h-4" /> Kembali ke keranjang
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Checkout</h1>

      <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Pengiriman */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="font-bold text-slate-900 mb-4">Informasi Pengiriman</h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Field label="Nama Lengkap *">
                <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Nomor HP / WhatsApp *">
                <input required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputCls} placeholder="0812..." />
              </Field>

              {apiMode && (
                <>
                  <Field label="Provinsi Tujuan *">
                    <select
                      required
                      value={provinceId}
                      onChange={(e) => setProvinceId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— Pilih provinsi —</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Kota / Kabupaten Tujuan *">
                    <select
                      required
                      value={cityId}
                      onChange={(e) => setCityId(e.target.value)}
                      disabled={!provinceId || loadingCities}
                      className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`}
                    >
                      <option value="">
                        {loadingCities ? 'Memuat kota...' : '— Pilih kota —'}
                      </option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                </>
              )}

              <Field label="Alamat Lengkap *" className="sm:col-span-2">
                <textarea
                  required
                  rows={3}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className={inputCls}
                  placeholder="Nama jalan, RT/RW, kelurahan, kecamatan, kode pos"
                />
              </Field>
              <Field label="Catatan Pesanan" className="sm:col-span-2">
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder="Opsional" />
              </Field>
            </div>
          </section>

          {/* Ekspedisi / Kurir */}
          {apiMode && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-rose-500" /> Pilih Ekspedisi
              </h2>

              {!cityId ? (
                <p className="text-sm text-slate-400">
                  Pilih provinsi & kota tujuan dulu untuk melihat pilihan kurir dan ongkir.
                </p>
              ) : loadingCost ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Menghitung ongkir...
                </div>
              ) : costError ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{costError}</span>
                </div>
              ) : options.length === 0 ? (
                <p className="text-sm text-slate-400">Tidak ada layanan pengiriman untuk tujuan ini.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {options.map((o) => {
                    const k = optionKey(o);
                    return (
                      <label
                        key={k}
                        className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                          selectedKey === k
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingOption"
                          checked={selectedKey === k}
                          onChange={() => setSelectedKey(k)}
                          className="accent-rose-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900">
                            {o.courier.toUpperCase()} • {o.service}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {o.description}
                            {o.etd ? ` • estimasi ${o.etd} hari` : ''}
                          </div>
                        </div>
                        <div className="font-bold text-slate-900 shrink-0 text-sm">
                          {rupiah(o.cost)}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Pembayaran */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="font-bold text-slate-900 mb-4">Metode Pembayaran</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {PAY_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    paymentMethod === m.value
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === m.value}
                    onChange={() => setPaymentMethod(m.value)}
                    className="mt-1 accent-rose-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{m.label}</div>
                    <div className="text-xs text-slate-500">{m.hint}</div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Setelah pesanan masuk, admin akan mengirim instruksi pembayaran via WhatsApp.
            </p>
          </section>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Ringkasan */}
        <aside>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:sticky lg:top-20 space-y-3">
            <h3 className="font-bold text-slate-900">Pesanan Anda</h3>

            <div className="space-y-2 pb-3 border-b border-slate-100 max-h-56 overflow-y-auto">
              {lines.map((l) => (
                <div key={l.productId} className="flex gap-2 text-xs">
                  <div className="w-10 h-10 shrink-0 bg-slate-100 rounded overflow-hidden flex items-center justify-center">
                    {l.imageUrl ? (
                      <img src={l.imageUrl} alt={l.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-900 font-semibold truncate">{l.name}</div>
                    <div className="text-slate-500">{l.quantity} × {rupiah(l.price)}</div>
                  </div>
                  <div className="font-semibold text-slate-900 shrink-0">
                    {rupiah(Number(l.price) * l.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <Row label={`Subtotal (${itemCount} item)`} value={rupiah(subtotal)} />

            {apiMode ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  Ongkir
                  {selectedOption && (
                    <span className="block text-[11px] text-slate-400">
                      {selectedOption.courier.toUpperCase()} {selectedOption.service}
                    </span>
                  )}
                </span>
                <span className="font-semibold text-slate-900">
                  {selectedOption ? rupiah(shippingFeeN) : '—'}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Ongkir</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={manualFee}
                  onChange={(e) => setManualFee(e.target.value)}
                  className="w-24 text-right px-2 py-1 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-between">
              <span className="font-bold text-slate-900">Total Bayar</span>
              <span className="font-bold text-lg text-rose-600">{rupiah(total)}</span>
            </div>

            <button
              type="submit"
              disabled={submitting || !shippingReady}
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Memproses...' : 'Buat Pesanan'}
            </button>
            {apiMode && !shippingReady && (
              <p className="text-[11px] text-amber-600 text-center">
                Pilih kota tujuan & ekspedisi untuk melanjutkan.
              </p>
            )}
            <p className="text-[10px] text-slate-400 text-center">
              Dengan menekan tombol di atas, Anda menyetujui syarat & ketentuan toko.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500';

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
