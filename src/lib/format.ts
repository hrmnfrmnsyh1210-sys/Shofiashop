export const rupiah = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return 'Rp 0';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return 'Rp 0';
  return `Rp ${n.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
};

/** Versi ringkas untuk grafik/label: Rp 1,2 jt · Rp 950 rb · Rp 3,4 M */
export const rupiahShort = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return 'Rp 0';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return 'Rp 0';
  const abs = Math.abs(n);
  const fmt = (x: number) => x.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  if (abs >= 1_000_000_000) return `Rp ${fmt(n / 1_000_000_000)} M`;
  if (abs >= 1_000_000) return `Rp ${fmt(n / 1_000_000)} jt`;
  if (abs >= 1_000) return `Rp ${fmt(n / 1_000)} rb`;
  return `Rp ${n.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
};

export const number = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('id-ID', { maximumFractionDigits: 0 });
};

export const formatDate = (input: string | Date | null | undefined): string => {
  if (!input) return '-';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (input: string | Date | null | undefined): string => {
  if (!input) return '-';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const toISODate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
