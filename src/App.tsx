import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Store, 
  Smartphone, 
  BarChart3, 
  Package, 
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-rose-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-rose-500 p-2 rounded-lg">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">Appify<span className="text-rose-500">.</span></span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#fitur" className="text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors">Fitur</a>
              <a href="#solusi" className="text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors">Solusi</a>
              <a href="#penawaran" className="text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors">Harga Khusus</a>
              <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors">
                Jadwalkan Demo
              </button>
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
            <a href="#solusi" className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-rose-500 hover:bg-slate-50 rounded-md">Solusi</a>
            <a href="#penawaran" className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-rose-500 hover:bg-slate-50 rounded-md">Harga Khusus</a>
            <div className="pt-2">
              <button className="w-full bg-slate-900 text-white px-5 py-3 rounded-xl text-base font-medium">
                Jadwalkan Demo
              </button>
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
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
            Proposal Khusus untuk Sofia Shop Tebas
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight max-w-4xl"
          >
            Tingkatkan Omzet & Kelola <span className="text-rose-500 relative whitespace-nowrap">
              <span className="relative z-10">Sofia Shop</span>
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-rose-200/80 -z-0" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"/>
              </svg>
            </span> Lebih Praktis
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl"
          >
            Aplikasi kasir (POS), manajemen stok, dan toko online cerdas yang dirancang khusus untuk mempermudah operasional harian toko ritel modern di wilayah Tebas dan sekitarnya.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <button className="flex items-center justify-center gap-2 px-8 py-4 bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all">
              Lihat Presentasi <ArrowRight className="w-5 h-5" />
            </button>
            <button className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
              Hubungi via WhatsApp
            </button>
          </motion.div>
        </div>

        {/* Dashboard Mockup */}
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
                <div className="mx-auto bg-slate-50 px-32 py-1.5 rounded-md border border-slate-200 text-xs text-slate-500 font-mono shadow-sm">
                  app.sofiashoptebas.com
                </div>
              </div>
              {/* Fake App Content */}
              <div className="grid grid-cols-1 md:grid-cols-4 aspect-[4/3] md:aspect-[21/9]">
                {/* Sidebar */}
                <div className="hidden md:block col-span-1 border-r border-slate-200 p-4 space-y-2 bg-white">
                  <div className="h-8 w-24 bg-rose-100 rounded-md mb-8"></div>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-10 rounded-lg flex items-center px-3 ${i===1 ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-transparent text-slate-400'}`}>
                      <div className={`w-5 h-5 rounded ${i===1 ? 'bg-rose-200' : 'bg-slate-200'} mr-3`}></div>
                      <div className={`h-2.5 rounded-full ${i===1 ? 'bg-rose-400 w-16' : 'bg-slate-200 w-20'}`}></div>
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
                    {[1,2,3].map(i => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 shadow-sm bg-white">
                        <div className="h-3 w-16 bg-slate-200 rounded-full mb-3"></div>
                        <div className={`h-6 w-24 rounded-full ${i===1 ? 'bg-rose-400' : 'bg-slate-300'}`}></div>
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
      <section id="solusi" className="py-24 bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-rose-500 font-semibold mb-3 tracking-wide text-xs uppercase">Validasi Masalah</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              Tantangan yang Sering Dihadapi Toko Berkembang
            </h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-6 border border-rose-100">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-3">Rekap Pesanan Manual</h4>
              <p className="text-slate-600 leading-relaxed text-sm">
                Kewalahan membalas chat Instagram & WhatsApp sekaligus mencatat pesanan ke buku tulis. Sering terjadi salah catat atau terlewat.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-6 border border-slate-200">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-3">Stok Sering Selisih</h4>
              <p className="text-slate-600 leading-relaxed text-sm">
                Stok barang di toko (offline) dan di Instagram sering tidak sinkron. Terpaksa membatalkan pesanan karena ternyata barang sudah habis.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-6 border border-rose-100">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-3">Tidak Tahu Laba Pasti</h4>
              <p className="text-slate-600 leading-relaxed text-sm">
                Uang masuk ada, tapi uang kas rasanya kurang. Sulit memantau laporan keuangan harian dan keuntungan bersih per bulan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section (Bento Grid Style) */}
      <section id="fitur" className="py-24 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8 text-slate-900 overflow-hidden relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-16">
            <h2 className="text-rose-500 font-semibold mb-3 tracking-wide text-xs uppercase">Solusi Cerdas</h2>
            <h3 className="text-3xl md:text-5xl font-bold leading-tight max-w-2xl text-slate-900">
              Satu Aplikasi, Semua Beres.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Box 1 */}
            <div className="md:col-span-2 bg-white shadow-sm border border-slate-200 p-8 rounded-3xl relative overflow-hidden group hover:border-slate-300 transition-colors">
              <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-rose-50 to-transparent"></div>
              <Store className="w-10 h-10 text-rose-500 mb-6 relative z-10" />
              <h4 className="text-2xl font-bold mb-4 text-slate-800 relative z-10">Aplikasi Kasir (POS) Offline & Online</h4>
              <p className="text-slate-600 leading-relaxed max-w-md relative z-10">
                Proses transaksi pelanggan yang datang langsung (walk-in) dengan cepat. Terhubung langsung dengan printer kasir bluetooth untuk cetak struk profesional.
              </p>
              
              <div className="mt-8 flex flex-col gap-3 relative z-10">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-rose-500" /> Mendukung Scan Barcode
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-rose-500" /> Cetak Struk / Kirim via WA
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-rose-500" /> Kasbon & Manajemen Member
                </div>
              </div>
            </div>

            {/* Bento Box 2 */}
            <div className="bg-white shadow-sm border border-slate-200 p-8 rounded-3xl relative overflow-hidden hover:border-slate-300 transition-colors">
              <Smartphone className="w-10 h-10 text-slate-400 mb-6" />
              <h4 className="text-2xl font-bold mb-4 text-slate-800">Katalog Web Khusus</h4>
              <p className="text-slate-600 leading-relaxed">
                Miliki link toko online (<span className="text-rose-500 font-medium">shop.sofiatebas.com</span>) yang bisa dipasang di bio Instagram. Pelanggan bisa order mandiri 24/7.
              </p>
            </div>

            {/* Bento Box 3 */}
            <div className="bg-white shadow-sm border border-slate-200 p-8 rounded-3xl relative overflow-hidden hover:border-slate-300 transition-colors">
              <Package className="w-10 h-10 text-slate-400 mb-6" />
              <h4 className="text-2xl font-bold mb-4 text-slate-800">Manajemen Stok Terpusat</h4>
              <p className="text-slate-600 leading-relaxed">
                Stok otomatis berkurang baik ketika laku di toko fisik maupun ada pesanan dari katalog online.
              </p>
            </div>

            {/* Bento Box 4 */}
            <div className="md:col-span-2 bg-white shadow-sm border border-slate-200 p-8 rounded-3xl relative overflow-hidden hover:border-slate-300 transition-colors">
              <BarChart3 className="w-10 h-10 text-rose-500 mb-6" />
              <h4 className="text-2xl font-bold mb-4 text-slate-800">Laporan Keuangan & Analitik Otomatis</h4>
              <p className="text-slate-600 leading-relaxed max-w-lg mb-8">
                Tinggalkan buku tulis. Pantau grafik penjualan, barang paling laris, pemasukan, pengeluaran, hingga estimasi laba kotor hari ini secara real-time dari HP Anda.
              </p>
              
              <div className="h-32 rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-end gap-3 transition-opacity">
                {[30, 45, 25, 60, 40, 75, 45, 90, 85, 100].map((h, i) => (
                  <div key={i} className={`flex-1 rounded-sm ${i % 3 === 0 ? 'bg-rose-400' : 'bg-slate-300'}`} style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Offer Section */}
      <section id="penawaran" className="py-24 bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-rose-500 font-semibold mb-3 tracking-wide text-xs uppercase">Penawaran Eksklusif</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">
               Spesial untuk Sofia Shop Tebas
            </h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Kami siap mendemokan aplikasi ini langsung ke toko Anda di daerah Tebas, atau melalui Google Meet.
            </p>
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 relative overflow-hidden">
            {/* Ribbon */}
            <div className="absolute top-6 -right-12 rotate-45 bg-rose-500 text-white px-12 py-1 text-sm font-bold shadow-sm">
              TERBATAS
            </div>

            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <h4 className="text-2xl font-bold text-slate-800">Paket Ekosistem Bisnis</h4>
                <p className="text-slate-600">
                  Dapatkan sistem lengkap dari Kasir, Gudang, hingga Website Katalog dalam satu harga langganan atau beli putus.
                </p>
                
                <ul className="space-y-4">
                  {[
                    'Akses Aplikasi Kasir (HP, Tablet, Laptop)',
                    'Website Katalog Toko Online (sofiashop.com/id)',
                    'Setup & Input Data Produk Awal (Gratis)',
                    'Training Staf Kasir secara Langsung',
                    'Dukungan & Perbaikan Teknis Prioritas'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-full md:w-auto bg-white shadow-lg p-8 rounded-2xl border border-slate-200 text-center">
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Mulai Dari</div>
                <div className="flex items-end justify-center gap-1 mb-6">
                  <span className="text-3xl font-bold text-slate-900">IDR</span>
                  <span className="text-5xl font-extrabold text-slate-900 tracking-tight">149<span className="text-3xl">k</span></span>
                  <span className="text-slate-500 font-medium mb-1">/bulan</span>
                </div>
                
                <div className="space-y-3">
                  <button className="w-full px-8 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex justify-center items-center gap-2">
                    Jadwalkan Demo Gratis
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-slate-500">Tersedia opsi Beli Putus (One-time Payment).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-rose-500 p-2 rounded-lg">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Appify<span className="text-rose-500">.</span></span>
          </div>
          
          <div className="text-slate-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} Solusi Digital Retail. Dibuat khusus untuk Sofia Shop Tebas.
          </div>
        </div>
      </footer>
    </div>
  );
}

