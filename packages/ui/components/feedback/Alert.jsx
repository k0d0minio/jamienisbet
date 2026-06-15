'use client';
import React from 'react';

const CSS = `
.jn-alert{
  display:flex; gap:12px; padding:14px 16px; border-radius:var(--radius-md);
  border:1px solid var(--border); background:var(--surface-2);
  font-family:var(--font-sans); font-size:14px; line-height:1.5; color:var(--text-1);
}
.jn-alert__icon{ flex:none; margin-top:1px; color:var(--text-3); }
.jn-alert__icon svg{ width:18px; height:18px; display:block; }
.jn-alert__title{ font-weight:600; margin:0 0 2px; }
.jn-alert__body{ color:var(--text-2); }
.jn-alert--info{ border-color:color-mix(in srgb,var(--primary) 30%,var(--border)); background:var(--primary-soft); }
.jn-alert--info .jn-alert__icon{ color:var(--primary); }
.jn-alert--success{ border-color:color-mix(in srgb,var(--success) 35%,var(--border)); background:var(--success-soft); }
.jn-alert--success .jn-alert__icon{ color:var(--success); }
.jn-alert--warning{ border-color:color-mix(in srgb,var(--warning) 35%,var(--border)); background:var(--warning-soft); }
.jn-alert--warning .jn-alert__icon{ color:var(--warning); }
.jn-alert--danger{ border-color:color-mix(in srgb,var(--danger) 35%,var(--border)); background:var(--danger-soft); }
.jn-alert--danger .jn-alert__icon{ color:var(--danger); }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'alert');
  s.textContent = CSS;
  document.head.appendChild(s);
}

const ICONS = {
  info: <path d="M12 16v-4M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />,
  success: <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />,
  warning: <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01" />,
  danger: <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />,
};

export function Alert({ variant = 'info', title, icon, className = '', children }) {
  inject();
  return (
    <div className={['jn-alert', `jn-alert--${variant}`, className].filter(Boolean).join(' ')} role="status">
      <span className="jn-alert__icon">
        {icon || (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[variant]}</svg>
        )}
      </span>
      <div>
        {title && <p className="jn-alert__title">{title}</p>}
        <div className="jn-alert__body">{children}</div>
      </div>
    </div>
  );
}
