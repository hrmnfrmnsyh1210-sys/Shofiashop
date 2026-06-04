import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, ScrollText, ShieldCheck, Store, UserCog } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { swalConfirm } from '../../lib/swal';

const NAV = [
  { to: '/super', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/super/tenants', label: 'Toko Berlangganan', icon: Store },
  { to: '/super/users', label: 'Pengguna & Staf', icon: UserCog },
  { to: '/super/activity', label: 'Log Aktivitas', icon: ScrollText },
];

export default function SuperLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    const ok = await swalConfirm({
      title: 'Keluar dari akun?',
      text: 'Anda perlu login kembali untuk masuk ke dashboard.',
      confirmText: 'Ya, keluar',
      danger: true,
    });
    if (!ok) return;
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      <aside className="w-64 h-screen shrink-0 bg-slate-900 text-slate-100 flex flex-col">
        <div className="h-16 shrink-0 flex items-center px-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-rose-500 p-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight">
              ComPos <span className="text-rose-400 text-xs font-semibold">SUPER</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-rose-500 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 px-3 py-3 border-t border-slate-800">
          <div className="px-3 pb-3">
            <div className="text-xs font-semibold truncate">{user?.name}</div>
            <div className="text-xs text-slate-400 truncate">{user?.email}</div>
            <div className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded">
              {user?.role}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
