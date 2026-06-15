'use client';
import React from 'react';

const CSS = `
.jn-dialog-overlay{
  position:fixed; inset:0; background:rgba(12,14,17,.45);
  backdrop-filter:blur(2px); display:flex; align-items:center; justify-content:center;
  padding:24px; z-index:1000; animation:jn-dlg-fade var(--duration-base) var(--ease-out);
}
.jn-dialog{
  width:100%; max-width:var(--_w,460px); background:var(--surface);
  border:1px solid var(--border); border-radius:var(--radius-lg);
  box-shadow:var(--shadow-xl); padding:var(--space-6);
  animation:jn-dlg-rise var(--duration-base) var(--ease-out);
}
.jn-dialog__head{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:8px; }
.jn-dialog__title{ font-family:var(--font-sans); font-size:20px; font-weight:600; letter-spacing:-.01em; margin:0; color:var(--text-1); }
.jn-dialog__close{ appearance:none; border:none; background:transparent; color:var(--text-3); cursor:pointer; padding:4px; border-radius:var(--radius-sm); line-height:0; }
.jn-dialog__close:hover{ background:var(--surface-sunken); color:var(--text-1); }
.jn-dialog__close svg{ width:18px; height:18px; }
.jn-dialog__body{ font-family:var(--font-sans); font-size:14px; line-height:1.6; color:var(--text-2); }
.jn-dialog__foot{ display:flex; justify-content:flex-end; gap:10px; margin-top:var(--space-6); }
@keyframes jn-dlg-fade{ from{ opacity:0; } }
@keyframes jn-dlg-rise{ from{ opacity:0; transform:translateY(8px); } }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'dialog');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function Dialog({ open = true, onClose, title, width, footer, children }) {
  inject();
  if (!open) return null;
  return (
    <div className="jn-dialog-overlay" onClick={onClose}>
      <div className="jn-dialog" style={width ? { '--_w': width + 'px' } : undefined} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="jn-dialog__head">
          {title && <h2 className="jn-dialog__title">{title}</h2>}
          {onClose && (
            <button className="jn-dialog__close" aria-label="Close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>
        <div className="jn-dialog__body">{children}</div>
        {footer && <div className="jn-dialog__foot">{footer}</div>}
      </div>
    </div>
  );
}
