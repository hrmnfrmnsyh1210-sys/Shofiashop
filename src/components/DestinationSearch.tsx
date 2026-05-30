import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { api } from '../lib/api';
import type { ShippingDestination } from '../lib/types';

interface Props {
  /** Currently selected destination label (controlled by parent). */
  selectedLabel?: string | null;
  onSelect: (dest: ShippingDestination | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Free-text search for a Komerce/RajaOngkir domestic destination
 * (province → city → district → sub-district + postal code).
 */
export function DestinationSearch({ selectedLabel, onSelect, placeholder, disabled }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ShippingDestination[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Debounced search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      api
        .get<ShippingDestination[]>('/shipping/destinations', {
          query: { search: q },
          skipAuth: true,
        })
        .then((r) => !cancelled && setResults(r))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const pick = (d: ShippingDestination) => {
    onSelect(d);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const clear = () => {
    onSelect(null);
    setQuery('');
    setResults([]);
  };

  // When a destination is already selected, show it as a chip with a clear button.
  if (selectedLabel) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
        <span className="flex-1 text-sm text-slate-800">{selectedLabel}</span>
        {!disabled && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-white hover:text-rose-600"
            aria-label="Ubah tujuan"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocusCapture={() => setOpen(true)}
          placeholder={placeholder ?? 'Ketik kota/kecamatan tujuan...'}
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-slate-50"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>

      {open && query.trim().length >= 3 && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-3 py-3 text-xs text-slate-400">Mencari...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-xs text-slate-400">
              Tidak ditemukan. Coba kata kunci lain (mis. nama kecamatan).
            </div>
          ) : (
            results.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => pick(d)}
                className="flex w-full items-start gap-2 border-b border-slate-50 px-3 py-2 text-left hover:bg-rose-50 last:border-b-0"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                <span className="text-xs text-slate-700">{d.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
