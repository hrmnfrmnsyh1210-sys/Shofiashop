import { Link, NavLink, Outlet } from 'react-router-dom';
import { ShoppingBag, Store } from 'lucide-react';
import { useCart } from '../../lib/cart';

export default function ShopLayout() {
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link to="/shop" className="flex items-center gap-2 shrink-0">
            <div className="bg-rose-500 p-2 rounded-lg">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-none">Sofia Shop</div>
              <div className="text-[10px] text-slate-400 leading-none mt-0.5">
                tokomu.compos.com
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-6 text-sm">
            <NavLink
              to="/shop"
              end
              className={({ isActive }) =>
                `font-medium transition-colors ${isActive ? 'text-rose-500' : 'text-slate-600 hover:text-rose-500'}`
              }
            >
              Belanja
            </NavLink>
            <a href="#kontak" className="font-medium text-slate-600 hover:text-rose-500">
              Kontak
            </a>
          </nav>

          <div className="flex-1" />

          <Link
            to="/shop/cart"
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
              <span className="font-bold text-slate-900">Sofia Shop</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Toko ritel modern di wilayah Tebas dan sekitarnya. Pesan online,
              ambil di toko atau dikirim ke alamat Anda.
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
              <li>WhatsApp: <a href="https://wa.me/6281234567890" className="text-rose-500 font-semibold">0812-3456-7890</a></li>
              <li>Email: hello@sofiashop.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-slate-400">
            <div>&copy; {new Date().getFullYear()} Sofia Shop.</div>
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

