import { useState } from 'react';
import { Store } from 'lucide-react';

/**
 * Logo aplikasi. Menampilkan `public/logo.png`.
 * Jika file belum ada / gagal dimuat, otomatis fallback ke ikon Store
 * sehingga tampilan tetap rapi tanpa gambar rusak.
 *
 * Taruh file logo di:  public/logo.png
 * Ukuran/warna diatur lewat `className` (mis. "w-5 h-5 text-white").
 */
export function Logo({ className, alt = 'ComPos' }: { className?: string; alt?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <Store className={className} />;

  return (
    <img
      src="/logo.png"
      alt={alt}
      onError={() => setFailed(true)}
      className={`object-contain ${className ?? ''}`}
    />
  );
}

/**
 * Wordmark "ComPos." — "Com" hitam, "Pos." pink.
 * Untuk latar gelap/berwarna, pakai variant `light` (Com putih, Pos pink muda).
 * Ukuran diatur lewat `className` (mis. "text-xl").
 */
export function Wordmark({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={`font-bold tracking-tight ${className ?? ''}`}>
      <span className={light ? 'text-white' : 'text-slate-900'}>Com</span>
      <span className={light ? 'text-rose-200' : 'text-rose-500'}>Pos.</span>
    </span>
  );
}
