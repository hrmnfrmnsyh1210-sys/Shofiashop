import Swal, { type SweetAlertIcon } from 'sweetalert2';
import { ApiError } from './api';

/* ──────────────────────────────────────────────────────────────
 * Wrapper SweetAlert2 bertema ComPos dengan kartu kustom:
 * header bergelombang berwarna + ikon bulat + tombol gelap.
 * Warna mengikuti tema web (rose primary di atas slate).
 * ────────────────────────────────────────────────────────────── */

type CardType = 'error' | 'success' | 'warning' | 'question';

const PALETTE: Record<CardType, { from: string; to: string; icon: string }> = {
  error: { from: '#fb7185', to: '#e11d48', icon: '#e11d48' }, // rose
  success: { from: '#34d399', to: '#059669', icon: '#059669' }, // emerald
  warning: { from: '#fb7185', to: '#e11d48', icon: '#e11d48' }, // rose (peringatan/destruktif)
  question: { from: '#fb7185', to: '#e11d48', icon: '#e11d48' }, // rose (brand)
};

const ICON_SVG: Record<CardType, (c: string) => string> = {
  error: (c) =>
    `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="6.5" x2="12" y2="13.5"/><circle cx="12" cy="17.5" r="1.2" fill="${c}" stroke="none"/></svg>`,
  warning: (c) =>
    `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="6.5" x2="12" y2="13.5"/><circle cx="12" cy="17.5" r="1.2" fill="${c}" stroke="none"/></svg>`,
  question: (c) =>
    `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.2 9a2.8 2.8 0 0 1 5.4 1c0 1.9-2.8 2.5-2.8 2.5"/><circle cx="12" cy="17.3" r="1.2" fill="${c}" stroke="none"/></svg>`,
  success: (c) =>
    `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6.5 9.5 17 4.5 12"/></svg>`,
};

const X_SVG =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';

const STYLE_ID = 'cs-swal-styles';

function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
  .cs-popup{padding:0!important;background:transparent!important;box-shadow:none!important;width:auto!important;border:0!important;overflow:visible!important;}
  .cs-popup .swal2-html-container{margin:0!important;padding:0!important;overflow:visible!important;}
  .cs-card{width:330px;max-width:86vw;background:#fff;border-radius:22px;overflow:hidden;position:relative;box-shadow:0 24px 60px -12px rgba(15,23,42,.35);text-align:center;}
  .cs-close{position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:9999px;background:#1e293b;color:#fff;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;z-index:6;transition:background .15s,transform .15s;}
  .cs-close:hover{background:#0f172a;transform:scale(1.08);}
  .cs-head{position:relative;height:118px;display:flex;align-items:center;justify-content:center;}
  .cs-wave{position:absolute;left:0;right:0;bottom:-1px;line-height:0;}
  .cs-badge{width:66px;height:66px;border-radius:9999px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(15,23,42,.16);position:relative;z-index:2;animation:cs-pop .35s cubic-bezier(.16,1,.3,1) both;}
  .cs-body{padding:14px 28px 28px;}
  .cs-title{font-size:22px;font-weight:800;letter-spacing:-.01em;color:#0f172a;margin:0 0 6px;}
  .cs-text{font-size:14px;color:#64748b;margin:0 0 22px;line-height:1.55;}
  .cs-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
  .cs-btn{padding:11px 24px;border-radius:11px;font-weight:700;font-size:14px;border:none;cursor:pointer;transition:background .15s,transform .1s;}
  .cs-btn:active{transform:scale(.97);}
  .cs-confirm{background:#1e293b;color:#fff;letter-spacing:.03em;}
  .cs-confirm:hover{background:#0f172a;}
  .cs-cancel{background:#f1f5f9;color:#475569;}
  .cs-cancel:hover{background:#e2e8f0;}
  @keyframes cs-pop{from{opacity:0;transform:scale(.5);}to{opacity:1;transform:scale(1);}}
  `;
  document.head.appendChild(style);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cardHtml(opts: {
  type: CardType;
  title: string;
  text?: string;
  actions: string;
}): string {
  const p = PALETTE[opts.type];
  return `
  <div class="cs-card">
    <button type="button" class="cs-close" aria-label="Tutup">${X_SVG}</button>
    <div class="cs-head" style="background:linear-gradient(135deg, ${p.from}, ${p.to});">
      <div class="cs-wave">
        <svg viewBox="0 0 330 42" preserveAspectRatio="none" width="100%" height="42">
          <path fill="#ffffff" d="M0,22 C70,44 150,2 230,14 C280,21 308,30 330,24 L330,42 L0,42 Z"></path>
        </svg>
      </div>
      <div class="cs-badge">${ICON_SVG[opts.type](p.icon)}</div>
    </div>
    <div class="cs-body">
      <h2 class="cs-title">${escapeHtml(opts.title)}</h2>
      ${opts.text ? `<p class="cs-text">${escapeHtml(opts.text)}</p>` : '<div style="height:4px"></div>'}
      <div class="cs-actions">${opts.actions}</div>
    </div>
  </div>`;
}

/** Tampilkan kartu kustom dan kembalikan true bila tombol konfirmasi ditekan. */
async function fireCard(opts: {
  type: CardType;
  title: string;
  text?: string;
  confirmText: string;
  cancelText?: string;
}): Promise<boolean> {
  ensureStyles();
  const actions = `
    ${opts.cancelText ? `<button type="button" class="cs-btn cs-cancel">${escapeHtml(opts.cancelText)}</button>` : ''}
    <button type="button" class="cs-btn cs-confirm">${escapeHtml(opts.confirmText)}</button>
  `;
  const res = await Swal.fire({
    html: cardHtml({ type: opts.type, title: opts.title, text: opts.text, actions }),
    width: 'auto',
    padding: 0,
    background: 'transparent',
    showConfirmButton: false,
    showCancelButton: false,
    showCloseButton: false,
    buttonsStyling: false,
    customClass: { popup: 'cs-popup' },
    didOpen: () => {
      const popup = Swal.getPopup();
      if (!popup) return;
      popup.querySelector('.cs-confirm')?.addEventListener('click', () => Swal.clickConfirm());
      popup.querySelector('.cs-cancel')?.addEventListener('click', () => Swal.clickCancel());
      popup.querySelector('.cs-close')?.addEventListener('click', () => Swal.clickCancel());
    },
  });
  return res.isConfirmed;
}

/** Toast kecil di pojok kanan atas — feedback proses sukses/info ringan. */
export const swalToast = (icon: SweetAlertIcon, title: string): Promise<unknown> =>
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 2400,
    timerProgressBar: true,
    customClass: { popup: 'rounded-xl text-sm' },
    didOpen: (el) => {
      el.addEventListener('mouseenter', Swal.stopTimer);
      el.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

export const swalSuccess = (title: string): Promise<unknown> => swalToast('success', title);

/** Kartu error dengan tombol "Coba Lagi". */
export const swalError = (err: unknown, fallback = 'Terjadi kesalahan'): Promise<boolean> => {
  const message =
    typeof err === 'string'
      ? err
      : err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : fallback;
  return fireCard({
    type: 'error',
    title: 'Oops!',
    text: message,
    confirmText: 'Coba Lagi',
  });
};

interface ConfirmOpts {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  /** Aksi destruktif → kartu peringatan. */
  danger?: boolean;
}

/** Kartu konfirmasi. Mengembalikan true bila pengguna menekan konfirmasi. */
export const swalConfirm = (opts: ConfirmOpts): Promise<boolean> =>
  fireCard({
    type: opts.danger ? 'warning' : 'question',
    title: opts.title,
    text: opts.text,
    confirmText: opts.confirmText ?? 'Ya, lanjutkan',
    cancelText: opts.cancelText ?? 'Batal',
  });

/** Loading blocking sederhana untuk proses async panjang. */
export const swalLoading = (title = 'Memproses...'): void => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: { popup: 'rounded-2xl', title: 'text-slate-900' },
    didOpen: () => Swal.showLoading(),
  });
};

export const swalClose = (): void => Swal.close();
