import { Link } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../lib/cart';
import { rupiah } from '../../lib/format';

export default function Cart() {
  const { lines, setQuantity, remove, subtotal, itemCount } = useCart();

  if (lines.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-1">Keranjang masih kosong</h2>
        <p className="text-slate-500 text-sm mb-6">Yuk pilih produk dulu di katalog.</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-3 rounded-xl"
        >
          Belanja Sekarang <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Keranjang</h1>
      <p className="text-sm text-slate-500 mb-6">{itemCount} item</p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {lines.map((l) => (
            <div
              key={l.productId}
              className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4"
            >
              <Link
                to={`/shop/product/${l.productId}`}
                className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center"
              >
                {l.imageUrl ? (
                  <img src={l.imageUrl} alt={l.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag className="w-6 h-6 text-slate-300" />
                )}
              </Link>

              <div className="flex-1 min-w-0 flex flex-col">
                <Link
                  to={`/shop/product/${l.productId}`}
                  className="text-sm font-semibold text-slate-900 hover:text-rose-500 line-clamp-2"
                >
                  {l.name}
                </Link>
                <div className="text-xs text-slate-500 mt-0.5">{rupiah(l.price)} / {l.unit}</div>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg">
                    <button
                      onClick={() => setQuantity(l.productId, l.quantity - 1)}
                      disabled={l.quantity <= 1}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{l.quantity}</span>
                    <button
                      onClick={() => setQuantity(l.productId, l.quantity + 1)}
                      disabled={l.quantity >= l.maxStock}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(l.productId)}
                    className="text-slate-400 hover:text-rose-500 p-1.5 rounded"
                    aria-label="Hapus dari keranjang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-slate-900">
                  {rupiah(Number(l.price) * l.quantity)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:sticky lg:top-20 space-y-3">
            <h3 className="font-bold text-slate-900">Ringkasan</h3>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal ({itemCount} item)</span>
              <span className="font-semibold">{rupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Ongkir</span>
              <span>Dihitung di checkout</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between">
              <span className="font-bold text-slate-900">Total</span>
              <span className="font-bold text-lg text-rose-600">{rupiah(subtotal)}</span>
            </div>
            <Link
              to="/shop/checkout"
              className="block text-center bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Lanjut ke Checkout
            </Link>
            <Link
              to="/shop"
              className="block text-center text-xs text-slate-500 hover:text-rose-500"
            >
              ← Lanjut belanja
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
