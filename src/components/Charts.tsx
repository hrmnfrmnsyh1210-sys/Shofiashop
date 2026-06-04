import {
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';

/* ──────────────────────────────────────────────────────────────
 * Lightweight, dependency-free SVG charts.
 * Tema: rose (#f43f5e) primary di atas slate. Semua chart responsif
 * (viewBox + preserveAspectRatio) dan punya interaksi hover.
 * ────────────────────────────────────────────────────────────── */

export interface AreaPoint {
  label: string;
  value: number;
}

/** Buat path kurva halus (Catmull-Rom → cubic bezier). */
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

interface AreaChartProps {
  data: AreaPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  /** Format untuk label sumbu-x / tooltip. */
  formatLabel?: (label: string) => string;
  color?: string;
}

export function AreaChart({
  data,
  height = 200,
  formatValue = (v) => String(v),
  formatLabel = (l) => l,
  color = '#f43f5e',
}: AreaChartProps) {
  const gid = useId().replace(/:/g, '');
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const W = 600;
  const H = height;
  const padX = 8;
  const padTop = 16;
  const padBottom = 24;

  const max = Math.max(1, ...data.map((d) => d.value));
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const pts = useMemo(
    () =>
      data.map((d, i) => ({
        x: padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW),
        y: padTop + innerH - (d.value / max) * innerH,
      })),
    [data, innerW, innerH, max],
  );

  const linePath = smoothPath(pts);
  const areaPath =
    pts.length > 0
      ? `${linePath} L ${pts[pts.length - 1].x} ${padTop + innerH} L ${pts[0].x} ${
          padTop + innerH
        } Z`
      : '';

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => padTop + innerH - t * innerH);

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el || data.length === 0) return;
    const rect = el.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width; // 0..1
    const idx = Math.round(rel * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, idx)));
  };

  const active = hover != null ? pts[hover] : null;
  // Sparse x labels: tampilkan ~6 label
  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      style={{ aspectRatio: `${W} / ${H}` }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((y, i) => (
          <line
            key={i}
            x1={padX}
            x2={W - padX}
            y1={y}
            y2={y}
            stroke="#e2e8f0"
            strokeWidth={1}
            strokeDasharray={i === gridLines.length - 1 ? '0' : '4 4'}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {areaPath && <path d={areaPath} fill={`url(#area-${gid})`} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {active && (
          <>
            <line
              x1={active.x}
              x2={active.x}
              y1={padTop}
              y2={padTop + innerH}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={active.x} cy={active.y} r={5} fill="white" stroke={color} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>

      {/* X-axis labels (HTML overlay agar teks tidak ikut ter-skew) */}
      <div className="absolute inset-x-0 bottom-0 h-5 px-2 pointer-events-none">
        {data.map((d, i) =>
          i % labelStep === 0 || i === data.length - 1 ? (
            <span
              key={i}
              className="absolute -translate-x-1/2 text-[10px] text-slate-400 whitespace-nowrap"
              style={{ left: `${(data.length === 1 ? 0.5 : i / (data.length - 1)) * 100}%` }}
            >
              {formatLabel(d.label)}
            </span>
          ) : null,
        )}
      </div>

      {/* Tooltip */}
      {hover != null && active && (
        <div
          className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-10"
          style={{
            left: `${(data.length === 1 ? 0.5 : hover / (data.length - 1)) * 100}%`,
            top: `${(active.y / H) * 100}%`,
            marginTop: -10,
          }}
        >
          <div className="bg-slate-900 text-white rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
            <div className="text-[10px] text-slate-300">{formatLabel(data[hover].label)}</div>
            <div className="text-xs font-bold">{formatValue(data[hover].value)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerTitle?: string;
  centerValue?: string;
}

export function DonutChart({
  segments,
  size = 180,
  thickness = 22,
  centerTitle,
  centerValue,
}: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const [hover, setHover] = useState<number | null>(null);

  let offset = 0;
  const arcs = segments.map((seg) => {
    const frac = total > 0 ? Math.max(0, seg.value) / total : 0;
    const dash = frac * circ;
    const arc = { seg, dash, gap: circ - dash, rotation: (offset / circ) * 360 };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={c} cy={c} r={r} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
          {total > 0 &&
            arcs.map((a, i) => (
              <circle
                key={i}
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={a.seg.color}
                strokeWidth={hover === i ? thickness + 4 : thickness}
                strokeDasharray={`${a.dash} ${a.gap}`}
                strokeDashoffset={-a.rotation * (circ / 360)}
                strokeLinecap="butt"
                className="transition-all duration-200"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              />
            ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
          {centerValue && <div className="text-lg font-bold text-slate-900 leading-tight">{centerValue}</div>}
          {centerTitle && <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{centerTitle}</div>}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-2.5">
        {segments.map((seg, i) => {
          const pct = total > 0 ? (Math.max(0, seg.value) / total) * 100 : 0;
          return (
            <div
              key={seg.label}
              className="flex items-center gap-2.5"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-sm text-slate-600 truncate flex-1">{seg.label}</span>
              <span className="text-sm font-semibold text-slate-900">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

/** Sparkline mungil untuk stat-card. */
export function Sparkline({ data, color = '#f43f5e', height = 36, className }: SparklineProps) {
  const gid = useId().replace(/:/g, '');
  const W = 120;
  const H = height;
  const pad = 3;
  if (data.length === 0) return null;
  const max = Math.max(1, ...data);
  const min = Math.min(...data);
  const span = Math.max(1, max - min);
  const pts = data.map((v, i) => ({
    x: pad + (data.length === 1 ? (W - pad * 2) / 2 : (i / (data.length - 1)) * (W - pad * 2)),
    y: pad + (H - pad * 2) - ((v - min) / span) * (H - pad * 2),
  }));
  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

interface BarRowProps {
  label: ReactNode;
  value: number;
  max: number;
  color?: string;
  caption?: ReactNode;
}

/** Baris bar horizontal untuk ranking (mis. produk terlaris). */
export function BarRow({ label, value, max, color = '#f43f5e', caption }: BarRowProps) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-sm font-medium text-slate-900 truncate">{label}</div>
        {caption && <div className="text-xs text-slate-500 shrink-0">{caption}</div>}
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
