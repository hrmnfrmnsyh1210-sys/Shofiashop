import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Store,
  Smartphone,
  BarChart3,
  Package,
  Users,
  ShieldCheck,
  Globe,
  Receipt,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tenantSlug, setTenantSlug] = useState('tokomu');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-rose-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-rose-500 p-2 rounded-lg">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">
                ComPos<span className="text-rose-500">.</span>
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#fitur" className="text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors">Fitur</a>
              <a href="#cara-kerja" className="text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors">Cara Kerja</a>
              <a href="#harga" className="text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors">Harga</a>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors">Login</Link>
              <Link to="/login" className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors">
                Mulai Gratis
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-600 hover:text-slate-900"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-lg">
            <a href="#fitur" className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-rose-500 hover:bg-slate-50 rounded-md">Fitur</a>
            <a href="#cara-kerja" className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-rose-500 hover:bg-slate-50 rounded-md">Cara Kerja</a>
            <a href="#harga" className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-rose-500 hover:bg-slate-50 rounded-md">Harga</a>
            <Link to="/login" className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-rose-500 hover:bg-slate-50 rounded-md">Login</Link>
            <div className="pt-2">
              <Link to="/login" className="block text-center w-full bg-slate-900 text-white px-5 py-3 rounded-xl text-base font-medium">
                Mulai Gratis
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] rounded-full bg-rose-100/40 blur-[80px] mix-blend-multiply" />
          <div className="absolute top-[10%] right-[20%] w-[400px] h-[400px] rounded-full bg-slate-200/40 blur-[80px] mix-blend-multiply" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-xs font-semibold text-rose-600 tracking-wider uppercase mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            POS + Toko Online untuk Setiap UMKM
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight max-w-4xl"
          >
            Punya Kasir &{' '}
            <span className="text-rose-500 relative whitespace-nowrap">
              <span className="relative z-10">Toko Online</span>
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-rose-200/80 -z-0" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" />
              </svg>
            </span>{' '}
            Sendiri, dalam Hitungan Menit.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl"
          >
            ComPos adalah platform yang memberi setiap pemilik toko sistem kasir (POS),
            manajemen stok, dan website toko online sendiri — lengkap di bawah satu
            subdomain yang bisa langsung dibagikan ke pelanggan.
          </motion.p>

          {/* Subdomain interactive demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-8 flex flex-col sm:flex-row items-center gap-3 bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm"
          >
            <span className="text-xs font-mono text-slate-400 pl-2">https://</span>
            <input
              type="text"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase().slice(0, 24) || '')}
              placeholder="namatoko"
              className="bg-transparent text-base sm:text-lg font-mono font-semibold text-slate-900 focus:outline-none w-32 text-center sm:text-left"
            />
            <span className="text-base sm:text-lg font-mono text-slate-500">.compos.com</span>
            <button className="ml-0 sm:ml-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5">
              Klaim <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link to="/login" className="flex items-center justify-center gap-2 px-8 py-4 bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all">
              Mulai Gratis 14 Hari <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#fitur" className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
              Lihat Toko Demo
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4 text-xs text-slate-500"
          >
            Tanpa kartu kredit. Tanpa biaya setup.
          </motion.p>
        </div>

        {/* Dashboard Mockup with subdomain in URL bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="relative bg-white p-4 rounded-3xl shadow-2xl border border-slate-200">
            <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm flex flex-col">
              <div className="h-12 bg-white border-b border-slate-200 flex items-center px-4 gap-2 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                </div>
                <div className="mx-auto bg-slate-50 px-6 sm:px-32 py-1.5 rounded-md border border-slate-200 text-xs text-slate-500 font-mono shadow-sm truncate max-w-[70%]">
                  {tenantSlug || 'namatoko'}.compos.com/admin
                </div>
              </div>
              {/* Fake App Content */}
              <div className="grid grid-cols-1 md:grid-cols-4 aspect-[4/3] md:aspect-[21/9]">
                {/* Sidebar */}
                <div className="hidden md:block col-span-1 border-r border-slate-200 p-4 space-y-2 bg-white">
                  <div className="h-8 w-24 bg-rose-100 rounded-md mb-8"></div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-10 rounded-lg flex items-center px-3 ${i === 1 ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-transparent text-slate-400'}`}>
                      <div className={`w-5 h-5 rounded ${i === 1 ? 'bg-rose-200' : 'bg-slate-200'} mr-3`}></div>
                      <div className={`h-2.5 rounded-full ${i === 1 ? 'bg-rose-400 w-16' : 'bg-slate-200 w-20'}`}></div>
                    </div>
                  ))}
                </div>
                {/* Main Content */}
                <div className="col-span-1 md:col-span-3 p-6 md:p-8 bg-slate-50 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="h-6 w-48 bg-slate-800 rounded mb-2"></div>
                      <div className="h-4 w-32 bg-slate-300 rounded"></div>
                    </div>
                    <div className="h-10 w-32 bg-slate-900 rounded-lg text-white text-xs font-bold flex items-center justify-center">Tambah Transaksi</div>
                  </div>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 shadow-sm bg-white">
                        <div className="h-3 w-16 bg-slate-200 rounded-full mb-3"></div>
                        <div className={`h-6 w-24 rounded-full ${i === 1 ? 'bg-rose-400' : 'bg-slate-300'}`}></div>
                      </div>
                    ))}
                  </div>
                  {/* Chart Area */}
                  <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6 flex items-end gap-2 mt-4 shadow-sm">
                    {[40, 70, 45, 90, 65, 80, 50, 100, 75, 85, 60].map((h, i) => (
                      <div key={i} className="flex-1 bg-slate-200 rounded-t-sm hover:bg-rose-400 transition-all cursor-pointer" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Masalah Section */}
      <section className="py-24 bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-rose-500 font-semibold mb-3 tracking-wide text-xs uppercase">Untuk Pemilik Toko</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              Berhenti Menyambung Tools yang Saling Tidak Bicara.
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-6 border border-rose-100">
                <Receipt className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-3">Kasir & DM Instagram Terpisah</h4>
              <p className="text-slate-600 leading-relaxed text-sm">
                Penjualan offline dicatat di buku, order online dicatat di chat. Stok dan
                laporan jadi semrawut, dan pelanggan harus DM untuk tanya barang ada atau tidak.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-6 border border-slate-200">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-3">Bikin Toko Online Ribet & Mahal</h4>
              <p className="text-slate-600 leading-relaxed text-sm">
                Domain, hosting, theme, integrasi pembayaran — terlalu banyak hal teknis untuk
                pemilik toko yang cuma ingin jualan. Marketplace pun motong margin terlalu besar.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-6 border border-rose-100">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-3">Tidak Tahu Laba Pasti</h4>
              <p className="text-slate-600 leading-relaxed text-sm">
                Uang masuk ada, tapi uang kas rasanya kurang. Tidak ada laporan harian yang
                otomatis menjumlahkan penjualan offline + online + harga modal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="cara-kerja" className="py-24 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-rose-500 font-semibold mb-3 tracking-wide text-xs uppercase">Cara Kerja</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              Dari Daftar Sampai Jualan, di Bawah 10 Menit.
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {[
              {
                step: '01',
                title: 'Daftar & Klaim Subdomain',
                desc: 'Pilih nama toko, langsung dapat alamat eksklusif seperti tokomu.compos.com — gratis, tanpa setup domain manual.',
                icon: Globe,
              },
              {
                step: '02',
                title: 'Input Produk & Atur Staf',
                desc: 'Tambah katalog produk lewat dashboard atau scan barcode. Undang staf sebagai Kasir, Manager, atau Admin dengan akses berbeda.',
                icon: Package,
              },
              {
                step: '03',
                title: 'Mulai Jualan, Offline & Online',
                desc: 'Buka POS di tablet/HP untuk transaksi di toko. Bagikan link subdomain ke Instagram bio — pelanggan order mandiri 24/7.',
                icon: Smartphone,
              },
            ].map((s) => (
              <div key={s.step} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-rose-200 transition-colors relative">
                <div className="absolute -top-4 left-8 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  {s.step}
                </div>
                <s.icon className="w-10 h-10 text-rose-500 mb-6" />
                <h4 className="text-xl font-bold mb-3 text-slate-800">{s.title}</h4>
                <p className="text-slate-600 leading-relaxed text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Section (Bento Grid Style) */}
      <section id="fitur" className="py-24 bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8 text-slate-900 overflow-hidden relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-16">
            <h2 className="text-rose-500 font-semibold mb-3 tracking-wide text-xs uppercase">Fitur Lengkap</h2>
            <h3 className="text-3xl md:text-5xl font-bold leading-tight max-w-2xl text-slate-900">
              Satu Platform, Semua Operasional Toko.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento 1 — POS */}
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-8 rounded-3xl relative overflow-hidden group hover:border-slate-300 transition-colors">
              <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-rose-50 to-transparent"></div>
              <Store className="w-10 h-10 text-rose-500 mb-6 relative z-10" />
              <h4 className="text-2xl font-bold mb-4 text-slate-800 relative z-10">Aplikasi Kasir (POS)</h4>
              <p className="text-slate-600 leading-relaxed max-w-md relative z-10">
                Proses transaksi walk-in dengan cepat dari HP, tablet, atau laptop. Stok dan
                laporan terupdate real-time — tidak perlu rekap ulang malam hari.
              </p>

              <div className="mt-8 flex flex-col gap-3 relative z-10">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-rose-500" /> Scan barcode & cari produk cepat
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-rose-500" /> Cetak struk atau kirim via WhatsApp
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-rose-500" /> Member, poin loyalti, & diskon
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-rose-500" /> Void transaksi mengembalikan stok otomatis
                </div>
              </div>
            </div>

            {/* Bento 2 — Toko Online subdomain */}
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl relative overflow-hidden hover:border-slate-300 transition-colors">
              <Globe className="w-10 h-10 text-rose-500 mb-6" />
              <h4 className="text-2xl font-bold mb-4 text-slate-800">Toko Online Subdomain</h4>
              <p className="text-slate-600 leading-relaxed mb-4">
                Setiap toko dapat alamat sendiri seperti{' '}
                <span className="text-rose-500 font-mono font-medium text-sm">
                  {tenantSlug || 'tokomu'}.compos.com
                </span>{' '}
                — siap dibagikan ke pelanggan.
              </p>
              <div className="text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono">
                Checkout publik, tanpa harus login.
              </div>
            </div>

            {/* Bento 3 — Stok */}
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl relative overflow-hidden hover:border-slate-300 transition-colors">
              <Package className="w-10 h-10 text-slate-700 mb-6" />
              <h4 className="text-2xl font-bold mb-4 text-slate-800">Stok Terpusat</h4>
              <p className="text-slate-600 leading-relaxed">
                Satu stok untuk offline & online. Setiap pergerakan (jual, retur, adjustment)
                tercatat sebagai stock movement yang bisa diaudit.
              </p>
            </div>

            {/* Bento 4 — Members */}
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl relative overflow-hidden hover:border-slate-300 transition-colors">
              <Users className="w-10 h-10 text-slate-700 mb-6" />
              <h4 className="text-2xl font-bold mb-4 text-slate-800">Database Pelanggan</h4>
              <p className="text-slate-600 leading-relaxed">
                Simpan kontak member, riwayat belanja, & poin loyalti. Hubungi ulang
                pelanggan langsung dari HP via WhatsApp.
              </p>
            </div>

            {/* Bento 5 — Reports */}
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-8 rounded-3xl relative overflow-hidden hover:border-slate-300 transition-colors">
              <BarChart3 className="w-10 h-10 text-rose-500 mb-6" />
              <h4 className="text-2xl font-bold mb-4 text-slate-800">Laporan & Analitik Otomatis</h4>
              <p className="text-slate-600 leading-relaxed max-w-lg mb-8">
                Penjualan harian, produk terlaris, COGS, gross profit, dan peringatan
                low-stock — semua dihitung otomatis dari transaksi yang masuk.
              </p>

              <div className="h-32 rounded-xl bg-white border border-slate-200 p-4 flex items-end gap-3 transition-opacity">
                {[30, 45, 25, 60, 40, 75, 45, 90, 85, 100].map((h, i) => (
                  <div key={i} className={`flex-1 rounded-sm ${i % 3 === 0 ? 'bg-rose-400' : 'bg-slate-300'}`} style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>

            {/* Bento 6 — Multi-role */}
            <div className="md:col-span-3 bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden">
              <ShieldCheck className="w-10 h-10 text-rose-400 mb-6" />
              <h4 className="text-2xl font-bold mb-4">Akses Bertingkat untuk Tim</h4>
              <p className="text-slate-300 leading-relaxed max-w-2xl mb-8">
                Berikan akses yang sesuai untuk setiap orang. Kasir tidak bisa lihat laba,
                Manager tidak bisa undang user baru — hanya Owner yang punya kontrol penuh.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { role: 'Admin / Owner', desc: 'Semua akses, atur user & pengaturan toko.' },
                  { role: 'Manager', desc: 'Kelola produk, stok, void transaksi, lihat laporan.' },
                  { role: 'Cashier', desc: 'Transaksi POS, lihat produk & data member.' },
                ].map((r) => (
                  <div key={r.role} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                    <div className="font-bold text-rose-300 text-sm mb-1">{r.role}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="harga" className="py-24 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-rose-500 font-semibold mb-3 tracking-wide text-xs uppercase">Harga Transparan</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">
              Satu Paket. Tanpa Biaya Tersembunyi.
            </h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Mulai gratis 14 hari. Bayar bulanan saat sudah yakin — kapan saja boleh berhenti.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {/* Main Plan */}
            <div className="md:col-span-3 bg-white rounded-3xl p-8 md:p-10 shadow-lg border-2 border-rose-200 relative overflow-hidden">
              <div className="absolute top-6 -right-12 rotate-45 bg-rose-500 text-white px-12 py-1 text-xs font-bold shadow-sm">
                POPULER
              </div>

              <div className="mb-6">
                <h4 className="text-2xl font-bold text-slate-800 mb-2">ComPos Standard</h4>
                <p className="text-slate-600 text-sm">Semua yang dibutuhkan toko ritel modern untuk berjualan offline & online.</p>
              </div>

              <div className="flex items-end gap-1 mb-1">
                <span className="text-2xl font-bold text-slate-900">Rp</span>
                <span className="text-5xl font-extrabold text-slate-900 tracking-tight">149rb</span>
                <span className="text-slate-500 font-medium mb-1">/bulan</span>
              </div>
              <div className="text-xs text-slate-500 mb-6">per toko, bayar bulanan</div>

              <Link to="/login" className="w-full px-6 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex justify-center items-center gap-2 mb-8">
                Mulai Gratis 14 Hari <ArrowRight className="w-4 h-4" />
              </Link>

              <ul className="space-y-3">
                {[
                  'Subdomain toko online (namatoko.compos.com)',
                  'POS untuk HP, tablet, & laptop (unlimited devices)',
                  'Produk, stok, & pergerakan stok unlimited',
                  'Manajemen member & poin loyalti',
                  'Laporan penjualan, COGS, & low-stock alert',
                  'Multi-user dengan 3 peran (Admin / Manager / Cashier)',
                  'Update fitur & support standar',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Add-ons */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h4 className="text-lg font-bold text-slate-800 mb-1">Add-on</h4>
              <p className="text-xs text-slate-500 mb-6">Tambah kapan saja saat dibutuhkan.</p>

              <div className="space-y-4">
                {[
                  { name: 'Custom Domain', price: 'Rp 49rb', unit: '/bln', desc: 'Pakai tokoku.com sebagai alamat toko.' },
                  { name: 'Setup & Input Produk', price: 'Rp 500rb', unit: 'sekali', desc: 'Tim kami input katalog awal hingga siap.' },
                  { name: 'Training Onsite', price: 'Rp 750rb', unit: 'sekali', desc: 'Pelatihan staf langsung di toko Anda.' },
                  { name: 'Prioritas Support', price: 'Rp 99rb', unit: '/bln', desc: 'Respon < 2 jam, WA channel khusus.' },
                ].map((a) => (
                  <div key={a.name} className="border-b border-slate-100 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-baseline gap-3 mb-1">
                      <div className="font-semibold text-slate-800 text-sm">{a.name}</div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900 text-sm">{a.price}</span>
                        <span className="text-xs text-slate-500"> {a.unit}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">{a.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-8">
            Bayar tahunan hemat 2 bulan. Butuh paket khusus untuk multi-cabang?{' '}
            <a href="#" className="text-rose-500 font-semibold hover:underline">Hubungi kami</a>.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4 relative">
            Toko Anda Layak Punya Sistemnya Sendiri.
          </h3>
          <p className="text-slate-300 max-w-xl mx-auto mb-8 relative">
            Klaim subdomain Anda hari ini. Gratis 14 hari, tanpa kartu kredit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
            <Link to="/login" className="px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2">
              Mulai Gratis <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="mailto:hello@compos.com" className="px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/20 transition-all backdrop-blur">
              Jadwalkan Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-rose-500 p-2 rounded-lg">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-800">
                  ComPos<span className="text-rose-500">.</span>
                </span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                Platform POS & toko online untuk UMKM Indonesia. Setiap toko, sistemnya sendiri.
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">Produk</div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#fitur" className="hover:text-rose-500">Fitur</a></li>
                <li><a href="#harga" className="hover:text-rose-500">Harga</a></li>
                <li><a href="#" className="hover:text-rose-500">Demo Toko</a></li>
                <li><a href="#" className="hover:text-rose-500">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">Akun</div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/login" className="hover:text-rose-500">Login</Link></li>
                <li><Link to="/login" className="hover:text-rose-500">Daftar Toko Baru</Link></li>
                <li><a href="mailto:hello@compos.com" className="hover:text-rose-500">Hubungi Support</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <div>&copy; {new Date().getFullYear()} ComPos. Made for Indonesian retailers.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-rose-500">Syarat & Ketentuan</a>
              <a href="#" className="hover:text-rose-500">Kebijakan Privasi</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
