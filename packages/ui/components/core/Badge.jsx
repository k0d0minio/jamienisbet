'use client';
import React from 'react';

const CSS = `
.jn-badge{
  display:inline-flex; align-items:center; gap:5px;
  height:22px; padding:0 9px; font-family:var(--font-mono);
  font-size:11px; font-weight:500; letter-spacing:.02em; line-height:1;
  border-radius:var(--radius-sm); border:1px solid transparent; white-space:nowrap;
}
.jn-badge--neutral{ background:var(--surface-sunken); color:var(--text-2); border-color:var(--border); }
.jn-badge--primary{ background:var(--primary-soft); color:var(--primary-soft-fg); }
.jn-badge--success{ background:var(--success-soft); color:var(--success); }
.jn-badge--warning{ background:var(--warning-soft); color:var(--warning); }
.jn-badge--danger{ background:var(--danger-soft); color:var(--danger); }
.jn-badge--solid{ background:var(--primary); color:var(--primary-fg); }
.jn-badge__dot{ width:6px; height:6px; border-radius:50%; background:currentColor; flex:none; }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'badge');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function Badge({ variant = 'neutral', dot = false, className = '', children, ...rest }) {
  inject();
  const cls = ['jn-badge', `jn-badge--${variant}`, className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...rest}>
      {dot && <span className="jn-badge__dot" />}
      {children}
    </span>
  );
}
