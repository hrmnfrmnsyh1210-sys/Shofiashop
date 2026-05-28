import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, Package, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { rupiah } from '../../lib/format';
import type { CatalogCategory, CatalogProduct, PaginatedResponse } from '../../lib/types';

type Sort = 'newest' | 'price-asc' | 'price-desc' | 'name';

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price-asc', label: 'Harga: Terendah' },
  { value: 'price-desc', label: 'Harga: Tertinggi' },
  { value: 'name', label: 'Nama A–Z' },
];

export default function ShopHome() {
  const [search, setSearch] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [data, setData] = useState<PaginatedResponse<CatalogProduct> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CatalogCategory[]>('/catalog/categories', { skipAuth: true })
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      api
        .get<PaginatedResponse<CatalogProduct>>('/catalog/products', {
          skipAuth: true,
          query: {
            search: search || undefined,
            categorySlug: categorySlug || undefined,
            sort,
            page,
            pageSize: 24,
          },
        })
        .then((r) => {
          if (!cancelled) setData(r);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message ?? 'Gagal memuat produk');
        })
        .finally(() => !cancelled && setLoading(false));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, categorySlug, sort, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-rose-50 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-rose-100 rounded-full text-xs font-semibold text-rose-600 tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Belanja Online
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 max-w-2xl">
            Belanja Praktis di Sofia Shop.
          </h1>
          <p className="mt-3 text-slate-600 max-w-xl">
            Pesan dari katalog, bayar via transfer, kami antar ke alamat Anda. Atau ambil langsung di toko.
          </p>

          <div className="mt-6 max-w-xl bg-white border border-slate-200 rounded-2xl flex items-center px-3 py-2 shadow-sm">
            <Search className="w-4 h-4 text-slate-400 mx-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari produk..."
              className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => {
              setCategorySlug('');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              !categorySlug
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCategorySlug(c.slug);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                categorySlug === c.slug
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {c.name}
            </button>
          ))}

          <div className="ml-auto">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as Sort);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Urutkan: {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 animate-pulse">
                <div className="aspect-square bg-slate-100 rounded-lg mb-3" />
                <div className="h-3 bg-slate-100 rounded mb-2 w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-500 text-sm">Tidak ada produk yang sesuai.</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.items.map((p) => (
                <Link
                  key={p.id}
                  to={`/shop/product/${p.id}`}
                  className="group bg-white border border-slate-200 hover:border-rose-300 hover:shadow-md rounded-xl p-3 transition-all"
                >
                  <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  {p.category && (
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                      {p.category.name}
                    </div>
                  )}
                  <div className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2 min-h-[2.5rem]">
                    {p.name}
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-base font-bold text-rose-600">{rupiah(p.price)}</div>
                    <div className="text-[10px] text-slate-400">stok {p.stock}</div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-slate-500">
                  Hal {page} dari {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
