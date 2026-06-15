'use client';
import React from 'react';

const CSS = `
.jn-ta-field{ display:flex; flex-direction:column; gap:6px; }
.jn-ta-field__label{ font-family:var(--font-sans); font-size:13px; font-weight:500; color:var(--text-1); }
.jn-ta-field__hint{ font-family:var(--font-sans); font-size:12px; color:var(--text-3); }
.jn-textarea{
  width:100%; min-height:96px; padding:10px 12px; font-family:var(--font-sans);
  font-size:14px; line-height:1.55; color:var(--text-1); background:var(--surface);
  border:1px solid var(--border-strong); border-radius:var(--radius-control);
  transition:var(--transition-control); outline:none; resize:vertical;
}
.jn-textarea::placeholder{ color:var(--text-3); }
.jn-textarea:hover{ border-color:var(--text-3); }
.jn-textarea:focus{ border-color:var(--border-focus); box-shadow:var(--shadow-ring); }
.jn-textarea:disabled{ opacity:.55; background:var(--surface-sunken); }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'textarea');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function Textarea({ label, hint, id, className = '', ...rest }) {
  inject();
  const fid = id || (label ? 'jn-ta-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <div className="jn-ta-field">
      {label && <label className="jn-ta-field__label" htmlFor={fid}>{label}</label>}
      <textarea id={fid} className={['jn-textarea', className].filter(Boolean).join(' ')} {...rest} />
      {hint && <span className="jn-ta-field__hint">{hint}</span>}
    </div>
  );
}
