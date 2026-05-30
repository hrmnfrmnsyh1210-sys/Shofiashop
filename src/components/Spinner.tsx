import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  /** pixel size of the spinner icon */
  size?: number;
  className?: string;
}

/** Small inline spinning indicator. */
export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return <Loader2 className={`animate-spin text-rose-500 ${className}`} style={{ width: size, height: size }} />;
}

interface LoadingProps {
  /** text shown under the spinner */
  label?: string;
  className?: string;
}

/** Centered loading block — use for full sections / page bodies. */
export function Loading({ label = 'Memuat...', className = '' }: LoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 text-slate-400 ${className}`}>
      <span className="relative inline-flex">
        <span className="absolute inline-flex h-10 w-10 rounded-full bg-rose-400/30 animate-ping" />
        <Spinner size={28} />
      </span>
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}

/** Shimmer skeleton block — pass width/height via className. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`skeleton block ${className}`} />;
}
