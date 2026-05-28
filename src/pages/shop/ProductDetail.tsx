import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, ShoppingBag, Check } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { rupiah } from '../../lib/format';
import type { CatalogProduct } from '../../lib/types';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { add } = useCart();

  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<CatalogProduct>(`/catalog/products/${id}`, { skipAuth: true })
      .then((p) => {
        setProduct(p);
        setError(null);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError && err.status === 404
            ? 'Produk tidak ditemukan atau sudah tidak tersedia.'
            : err instanceof ApiError
            ? err.message
            : 'Gagal memuat produk',
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    add(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        unit: product.unit,
        maxStock: product.stock,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-slate-100 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-3 bg-slate-100 rounded w-1/3" />
            <div className="h-8 bg-slate-100 rounded w-3/4" />
            <div className="h-6 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-slate-500 mb-4">{error ?? 'Produk tidak ditemukan'}</div>
        <Link to="/shop" className="text-rose-500 font-semibold hover:underline">
          ← Kembali ke katalog
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock < 1;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square bg-white border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <ShoppingBag className="w-16 h-16 text-slate-200" />
          )}
        </div>

        <div className="flex flex-col">
          {product.category && (
            <Link
              to={`/shop?category=${product.category.slug}`}
              className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 hover:text-rose-500"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-3">
            {product.name}
          </h1>
          <div className="text-3xl font-extrabold text-rose-600 mb-4">{rupiah(product.price)}</div>

          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full w-fit mb-6 ${
            outOfStock ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {outOfStock ? 'Stok habis' : `Stok tersedia: ${product.stock} ${product.unit}`}
          </div>

          {product.description && (
            <p className="text-sm text-slate-600 leading-relaxed mb-8 whitespace-pre-line">
              {product.description}
            </p>
          )}

          {!outOfStock && (
            <div className="mt-auto space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">Jumlah:</span>
                <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-400">Maks {product.stock}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" /> Ditambahkan
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" /> Tambah ke Keranjang
                    </>
                  )}
                </button>
                <Link
                  to="/shop/cart"
                  onClick={handleAdd}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-colors text-center"
                >
                  Beli Sekarang
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
