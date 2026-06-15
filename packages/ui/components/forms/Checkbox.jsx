'use client';
import React from 'react';

const CSS = `
.jn-check{ display:inline-flex; align-items:flex-start; gap:10px; cursor:pointer; font-family:var(--font-sans); font-size:14px; color:var(--text-1); user-select:none; }
.jn-check input{ position:absolute; opacity:0; width:0; height:0; }
.jn-check__box{
  width:18px; height:18px; flex:none; margin-top:1px; border-radius:var(--radius-xs);
  border:1.5px solid var(--border-strong); background:var(--surface);
  display:inline-flex; align-items:center; justify-content:center;
  transition:var(--transition-control); color:#fff;
}
.jn-check__box svg{ width:12px; height:12px; opacity:0; transform:scale(.6); transition:opacity var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out); }
.jn-check:hover .jn-check__box{ border-color:var(--text-3); }
.jn-check input:checked + .jn-check__box{ background:var(--primary); border-color:var(--primary); }
.jn-check input:checked + .jn-check__box svg{ opacity:1; transform:scale(1); }
.jn-check input:focus-visible + .jn-check__box{ box-shadow:var(--shadow-ring); }
.jn-check input:disabled + .jn-check__box{ opacity:.5; }
.jn-check--disabled{ cursor:not-allowed; opacity:.7; }
.jn-check__text{ line-height:1.4; }
.jn-check__desc{ display:block; font-size:12px; color:var(--text-3); margin-top:2px; }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'checkbox');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function Checkbox({ label, description, disabled = false, className = '', children, ...rest }) {
  inject();
  return (
    <label className={['jn-check', disabled ? 'jn-check--disabled' : '', className].filter(Boolean).join(' ')}>
      <input type="checkbox" disabled={disabled} {...rest} />
      <span className="jn-check__box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      </span>
      {(label || children) && (
        <span className="jn-check__text">
          {label || children}
          {description && <span className="jn-check__desc">{description}</span>}
        </span>
      )}
    </label>
  );
}
