import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  X,
  Receipt as ReceiptIcon,
  Loader2,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { rupiah } from '../../lib/format';
import type {
  Member,
  PaginatedResponse,
  PaymentMethod,
  Product,
  Transaction,
} from '../../lib/types';

interface CartItem {
  product: Product;
  quantity: number;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Tunai' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'EWALLET', label: 'E-Wallet' },
  { value: 'CARD', label: 'Kartu' },
  { value: 'OTHER', label: 'Lainnya' },
];

export default function POS() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberLookupLoading, setMemberLookupLoading] = useState(false);
  const [memberLookupError, setMemberLookupError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [discount, setDiscount] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastTrx, setLastTrx] = useState<Transaction | null>(null);

  // Debounced product search
  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    const t = setTimeout(() => {
      api
        .get<PaginatedResponse<Product>>('/products', {
          query: { search, isActive: 'true', pageSize: 24, sort: 'name' },
        })
        .then((r) => {
          if (!cancelled) setProducts(r.items);
        })
        .catch(() => {
          if (!cancelled) setProducts([]);
        })
        .finally(() => !cancelled && setProductsLoading(false));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search]);

  const addToCart = useCallback((p: Product) => {
    setCart((cur) => {
      const existing = cur.find((c) => c.product.id === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) return cur;
        return cur.map((c) =>
          c.product.id === p.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      if (p.stock < 1) return cur;
      return [...cur, { product: p, quantity: 1 }];
    });
  }, []);

  const updateQty = (id: string, delta: number) => {
    setCart((cur) =>
      cur
        .map((c) => {
          if (c.product.id !== id) return c;
          const next = c.quantity + delta;
          if (next < 1) return c;
          if (next > c.product.stock) return c;
          return { ...c, quantity: next };
        })
        .filter((c) => c.quantity > 0),
    );
  };
  const removeItem = (id: string) => setCart((cur) => cur.filter((c) => c.product.id !== id));

  const lookupMember = async () => {
    setMemberLookupError(null);
    if (!memberSearch.trim()) return;
    setMemberLookupLoading(true);
    try {
      const m = await api.get<Member>(`/members/phone/${encodeURIComponent(memberSearch.trim())}`);
      setMember(m);
      setMemberSearch('');
    } catch (err) {
      setMemberLookupError(
        err instanceof ApiError && err.status === 404
          ? 'Member tidak ditemukan'
          : err instanceof ApiError
          ? err.message
          : 'Gagal mencari member',
      );
    } finally {
      setMemberLookupLoading(false);
    }
  };

  const subtotal = useMemo(
    () => cart.reduce((s, c) => s + Number(c.product.price) * c.quantity, 0),
    [cart],
  );
  const discountN = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountN);
  const paymentN = Number(paymentAmount) || 0;
  const change = paymentMethod === 'CASH' ? Math.max(0, paymentN - total) : 0;
  const insufficientCash = paymentMethod === 'CASH' && cart.length > 0 && paymentN < total;

  const resetCart = () => {
    setCart([]);
    setMember(null);
    setMemberSearch('');
    setDiscount('');
    setPaymentAmount('');
    setSubmitError(null);
  };

  const submit = async () => {
    setSubmitError(null);
    if (cart.length === 0) return;
    if (insufficientCash) {
      setSubmitError('Jumlah pembayaran tunai kurang dari total.');
      return;
    }
    setSubmitting(true);
    try {
      const trx = await api.post<Transaction>('/transactions', {
        channel: 'POS',
        paymentMethod,
        memberId: member?.id ?? null,
        discount: discountN,
        paymentAmount: paymentMethod === 'CASH' ? paymentN : total,
        items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
      });
      setLastTrx(trx);
      resetCart();
      // Refresh products to reflect new stock
      const fresh = await api.get<PaginatedResponse<Product>>('/products', {
        query: { search, isActive: 'true', pageSize: 24, sort: 'name' },
      });
      setProducts(fresh.items);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Gagal memproses transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex flex-col lg:flex-row">
      {/* Product grid */}
      <section className="flex-1 flex flex-col bg-slate-50 min-h-0">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk (nama, SKU, atau barcode)..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {productsLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Mencari...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Tidak ada produk.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.stock < 1}
                  className="text-left bg-white border border-slate-200 hover:border-rose-300 hover:shadow-md disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:shadow-none rounded-xl p-3 transition-all"
                >
                  <div className="aspect-square bg-slate-100 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-900 line-clamp-2 mb-1">{p.name}</div>
                  <div className="text-sm font-bold text-rose-600">{rupiah(p.price)}</div>
                  <div className={`text-xs mt-0.5 ${p.stock < 1 ? 'text-rose-500' : 'text-slate-500'}`}>
                    Stok: {p.stock} {p.unit}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Cart */}
      <aside className="w-full lg:w-96 xl:w-104 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col min-h-0">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-slate-600" />
          <h2 className="font-bold text-slate-900">Keranjang</h2>
          <span className="ml-auto text-xs bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full">
            {cart.length} item
          </span>
        </div>

        {/* Member */}
        <div className="p-3 border-b border-slate-100 bg-slate-50">
          {member ? (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              <User className="w-4 h-4 text-rose-500" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{member.name}</div>
                <div className="text-xs text-slate-500 truncate">
                  {member.phone} • {member.points} pts
                </div>
              </div>
              <button onClick={() => setMember(null)} className="text-slate-400 hover:text-rose-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupMember()}
                  placeholder="No HP member (opsional)"
                  className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  onClick={lookupMember}
                  disabled={memberLookupLoading || !memberSearch.trim()}
                  className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {memberLookupLoading ? '...' : 'Cari'}
                </button>
              </div>
              {memberLookupError && (
                <div className="text-xs text-rose-600 mt-1">{memberLookupError}</div>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-12 px-4">
              Pilih produk di sebelah kiri untuk memulai transaksi.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cart.map((c) => (
                <div key={c.product.id} className="p-3 flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{c.product.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{rupiah(c.product.price)} × {c.quantity}</div>
                    <div className="flex items-center gap-1 mt-2">
                      <button
                        onClick={() => updateQty(c.product.id, -1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{c.quantity}</span>
                      <button
                        onClick={() => updateQty(c.product.id, 1)}
                        disabled={c.quantity >= c.product.stock}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(c.product.id)}
                        className="ml-2 w-6 h-6 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-sm font-bold text-slate-900 shrink-0">
                    {rupiah(Number(c.product.price) * c.quantity)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / payment */}
        <div className="border-t border-slate-200 p-4 space-y-3 bg-slate-50">
          <div className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={rupiah(subtotal)} />
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Diskon</span>
              <input
                type="number"
                inputMode="numeric"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="w-28 text-right px-2 py-1 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <Row label="Total" value={rupiah(total)} bold />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`text-xs font-semibold py-2 rounded-md border transition-colors ${
                    paymentMethod === m.value
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'CASH' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tunai Diterima</label>
              <input
                type="number"
                inputMode="numeric"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-between mt-1.5 text-xs">
                <span className="text-slate-500">Kembalian</span>
                <span className={`font-bold ${insufficientCash ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {insufficientCash ? 'Kurang' : rupiah(change)}
                </span>
              </div>
            </div>
          )}

          {submitError && (
            <div className="text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md px-2.5 py-1.5">
              {submitError}
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting || cart.length === 0 || insufficientCash}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Memproses...' : `Bayar ${rupiah(total)}`}
          </button>
        </div>
      </aside>

      {/* Receipt modal */}
      {lastTrx && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <ReceiptIcon className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-lg text-slate-900">Transaksi Berhasil</h3>
            </div>
            <div className="text-sm space-y-2 mb-6 font-mono">
              <Row label="No. Transaksi" value={lastTrx.transactionNumber} />
              <Row label="Total" value={rupiah(lastTrx.total)} bold />
              <Row label="Bayar" value={rupiah(lastTrx.paymentAmount)} />
              <Row label="Kembali" value={rupiah(lastTrx.changeAmount)} />
            </div>
            <button
              onClick={() => setLastTrx(null)}
              className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
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
