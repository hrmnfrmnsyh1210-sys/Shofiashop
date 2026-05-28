import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Users,
  Receipt,
  Boxes,
  LineChart,
  LogOut,
  Store,
  Menu,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import type { UserRole } from '../../lib/types';

const ALL_NAV: Array<{ to: string; label: string; icon: typeof LayoutDashboard; roles?: UserRole[]; end?: boolean }> = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'], end: true },
  { to: '/admin/pos', label: 'POS / Kasir', icon: ShoppingCart },
  { to: '/admin/products', label: 'Produk', icon: Package },
  { to: '/admin/categories', label: 'Kategori', icon: FolderTree, roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/members', label: 'Member', icon: Users },
  { to: '/admin/transactions', label: 'Transaksi', icon: Receipt },
  { to: '/admin/stock', label: 'Stok', icon: Boxes, roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/reports', label: 'Laporan', icon: LineChart, roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/settings', label: 'Pengaturan Toko', icon: SettingsIcon, roles: ['ADMIN'] },
];

export default function AdminLayout() {
  const { user, tenant, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const nav = ALL_NAV.filter((n) => !n.roles || hasRole(...n.roles));

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform md:translate-x-0 md:static md:flex ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-rose-500 p-1.5 rounded-lg shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm tracking-tight text-slate-900 truncate">
                {tenant?.name ?? 'ComPos'}
              </div>
              {tenant?.slug && (
                <div className="text-[10px] text-slate-400 font-mono truncate">/s/{tenant.slug}</div>
              )}
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="w-4.5 h-4.5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-slate-200">
          <div className="px-3 pb-3">
            <div className="text-xs font-semibold text-slate-900 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            <div className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {user?.role}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Overlay (mobile) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-rose-500 p-1 rounded">
              <Store className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">ComPos</span>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
