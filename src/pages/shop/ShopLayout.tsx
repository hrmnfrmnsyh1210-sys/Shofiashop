import { Link, NavLink, Outlet } from 'react-router-dom';
import { ShoppingBag, Store } from 'lucide-react';
import { useCart } from '../../lib/cart';
import { StoreProvider, useStore } from '../../lib/store';

export default function ShopLayout() {
  return (
    <StoreProvider>
      <ShopShell />
    </StoreProvider>
  );
}

function ShopShell() {
  const { itemCount } = useCart();
  const { store, slug, loading, error, path } = useStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Memuat toko...
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Store className="w-10 h-10 text-slate-300 mb-3" />
        <h2 className="font-bold text-slate-800 mb-1">Toko tidak ditemukan</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          {error ?? 'Tautan toko ini tidak valid atau sudah dinonaktifkan.'}
        </p>
        <Link to="/" className="mt-4 text-rose-500 text-sm font-semibold hover:underline">
          ← Kembali ke ComPos
        </Link>
      </div>
    );
  }

  const subdomainText =
    store.customDomain ?? `${slug}.compos.com`;
  const waNumber = store.whatsapp?.replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link to={path('')} className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-rose-500 flex items-center justify-center">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-none">{store.name}</div>
              <div className="text-[10px] text-slate-400 leading-none mt-0.5">{subdomainText}</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-6 text-sm">
            <NavLink
              to={path('')}
              end
              className={({ isActive }) =>
                `font-medium transition-colors ${isActive ? 'text-rose-500' : 'text-slate-600 hover:text-rose-500'}`
              }
            >
              Belanja
            </NavLink>
            <NavLink
              to={path('lacak')}
              className={({ isActive }) =>
                `font-medium transition-colors ${isActive ? 'text-rose-500' : 'text-slate-600 hover:text-rose-500'}`
              }
            >
              Lacak Pesanan
            </NavLink>
            <a href="#kontak" className="font-medium text-slate-600 hover:text-rose-500">
              Kontak
            </a>
          </nav>

          <div className="flex-1" />

          <Link
            to={path('cart')}
            className="relative flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Keranjang</span>
            {itemCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center -mr-1">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer id="kontak" className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-rose-500 p-1.5 rounded-md">
                <Store className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-slate-900">{store.name}</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              {store.description ?? 'Pesan online, ambil di toko atau dikirim ke alamat Anda.'}
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Bantuan</div>
            <ul className="space-y-1.5 text-slate-600">
              <li><a href="#" className="hover:text-rose-500">Cara Pesan</a></li>
              <li><a href="#" className="hover:text-rose-500">Pengiriman</a></li>
              <li><a href="#" className="hover:text-rose-500">Kebijakan Retur</a></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Kontak</div>
            <ul className="space-y-1.5 text-slate-600">
              {waNumber && (
                <li>
                  WhatsApp:{' '}
                  <a href={`https://wa.me/${waNumber}`} className="text-rose-500 font-semibold">
                    {store.whatsapp}
                  </a>
                </li>
              )}
              {store.email && <li>Email: {store.email}</li>}
              {store.address && <li>Alamat: {store.address}</li>}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-slate-400">
            <div>&copy; {new Date().getFullYear()} {store.name}.</div>
            <div>
              Powered by{' '}
              <Link to="/" className="text-rose-500 font-semibold hover:underline">
                ComPos
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
