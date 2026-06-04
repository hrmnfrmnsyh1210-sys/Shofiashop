import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Store,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
  ShoppingCart,
  Globe,
  BarChart3,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';
import { swalSuccess } from '../lib/swal';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fallback = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('admin@sofiashop.local');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const homeFor = (role: string | undefined) =>
    fallback ?? (role === 'SUPER_ADMIN' ? '/super' : '/admin');

  useEffect(() => {
    if (user) navigate(homeFor(user.role), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const next = await login(email.trim().toLowerCase(), password);
      void swalSuccess(`Selamat datang, ${next.name}`);
      navigate(homeFor(next.role), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login gagal. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2 bg-white">
      {/* ── Panel kiri: brand + gradasi pink bertingkat ───────────── */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 p-12 text-white">
        {/* Layer pink bertingkat */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 animate-aurora" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-rose-300/30 blur-2xl animate-aurora" style={{ animationDelay: '-6s' }} />
        <div className="absolute -bottom-32 left-1/4 w-[28rem] h-[28rem] rounded-full bg-fuchsia-400/20 blur-3xl animate-aurora" style={{ animationDelay: '-3s' }} />
        {/* Lingkaran konsentris bertingkat */}
        <div className="absolute -bottom-40 -right-40 pointer-events-none">
          <div className="w-[30rem] h-[30rem] rounded-full border border-white/10 flex items-center justify-center">
            <div className="w-[22rem] h-[22rem] rounded-full border border-white/10 flex items-center justify-center">
              <div className="w-[14rem] h-[14rem] rounded-full bg-white/5" />
            </div>
          </div>
        </div>

        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur p-2 rounded-xl ring-1 ring-white/30">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              ComPos<span className="text-rose-100">.</span>
            </span>
          </Link>
        </motion.div>

        {/* Heading + fitur */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10 max-w-md"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold tracking-wide mb-5 ring-1 ring-white/20">
            <Sparkles className="w-3.5 h-3.5" /> Kasir + Toko Online jadi satu
          </div>
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Kelola toko Anda,
            <br />
            semudah tersenyum.
          </h2>
          <p className="mt-4 text-rose-50/90 leading-relaxed">
            Satu dashboard untuk transaksi, stok, member, dan laporan —
            online maupun offline, kapan saja dari mana saja.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: ShoppingCart, label: 'Kasir cepat di HP, tablet, & laptop' },
              { icon: Globe, label: 'Toko online dengan subdomain sendiri' },
              { icon: BarChart3, label: 'Laporan & laba dihitung otomatis' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20 shrink-0">
                  <f.icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-sm text-rose-50/95">{f.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer panel */}
        <div className="relative z-10 text-xs text-rose-100/70">
          &copy; {new Date().getFullYear()} ComPos. Dibuat untuk UMKM Indonesia.
        </div>
      </div>

      {/* ── Panel kanan: form ─────────────────────────────────────── */}
      <div className="relative flex flex-col px-4 sm:px-8 lg:px-12 py-6 overflow-hidden">
        {/* Aksen pink lembut di belakang (agar tidak polos) */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-rose-100/60 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-fuchsia-100/50 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-rose-50/40" />
        </div>

        {/* Header: logo (mobile) + pintasan kembali */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 text-slate-700 lg:invisible">
            <div className="bg-rose-500 p-2 rounded-lg">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              ComPos<span className="text-rose-500">.</span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur border border-rose-100 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-200 shadow-sm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke beranda
          </Link>
        </div>

        {/* Form terpusat di sisa ruang */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex-1 flex flex-col justify-center w-full max-w-md mx-auto py-8"
        >
          <div className="relative bg-white/80 backdrop-blur-xl border border-rose-100 rounded-3xl shadow-[0_20px_60px_-20px_rgba(244,63,94,0.35)] p-8 sm:p-10">
            {/* Ikon sambutan */}
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-200 animate-float-soft">
                  <Store className="w-7 h-7 text-white" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-300 flex items-center justify-center text-amber-700 shadow">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div className="text-center mb-7">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Selamat datang kembali 👋</h1>
              <p className="text-sm text-slate-500 mt-1.5">Masuk ke dashboard toko Anda.</p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                    className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition"
                    placeholder="anda@toko.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kata Sandi</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-70 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-200 hover:shadow-rose-300 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Masuk...
                  </>
                ) : (
                  <>
                    Masuk <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
              Belum punya akun?{' '}
              <a href="mailto:hello@compos.com" className="text-rose-500 font-semibold hover:underline">
                Hubungi kami untuk daftar
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
