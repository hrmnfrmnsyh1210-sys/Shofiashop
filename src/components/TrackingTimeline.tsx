import { PackageCheck } from 'lucide-react';
import type { TrackingInfo } from '../lib/types';

/**
 * Renders live courier tracking (status badge + journey history newest-first).
 * Shared by the admin order detail and the public storefront tracking page.
 */
export function TrackingTimeline({ tracking }: { tracking: TrackingInfo }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs">
          <span className="font-semibold text-slate-700">{tracking.courier}</span>
          <span className="font-mono text-slate-500"> · {tracking.waybill}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${
            tracking.delivered ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
          }`}
        >
          {tracking.delivered && <PackageCheck className="w-3.5 h-3.5" />}
          {tracking.status || (tracking.delivered ? 'TERKIRIM' : 'DALAM PROSES')}
        </span>
      </div>

      <ol className="relative border-l border-slate-200 ml-1.5 space-y-3">
        {tracking.history.length === 0 ? (
          <li className="ml-4 text-xs text-slate-400">Belum ada riwayat perjalanan.</li>
        ) : (
          tracking.history.map((h, i) => (
            <li key={i} className="ml-4">
              <span
                className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white ${
                  i === 0 ? 'bg-rose-500' : 'bg-slate-300'
                }`}
              />
              <div className="text-[11px] text-slate-400">
                {h.date}
                {h.status && ` · ${h.status}`}
              </div>
              <div className="text-xs text-slate-700">{h.description}</div>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
