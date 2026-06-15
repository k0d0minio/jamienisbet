'use client';
import React from 'react';

const CSS = `
.jn-switch{ display:inline-flex; align-items:center; gap:10px; cursor:pointer; font-family:var(--font-sans); font-size:14px; color:var(--text-1); user-select:none; }
.jn-switch input{ position:absolute; opacity:0; width:0; height:0; }
.jn-switch__track{
  width:38px; height:22px; flex:none; border-radius:var(--radius-full);
  background:var(--neutral-300); transition:background-color var(--duration-base) var(--ease-out);
  position:relative; padding:2px;
}
.jn-switch__thumb{
  width:18px; height:18px; border-radius:50%; background:#fff;
  box-shadow:var(--shadow-sm); transition:transform var(--duration-base) var(--ease-out);
}
.jn-switch input:checked + .jn-switch__track{ background:var(--primary); }
.jn-switch input:checked + .jn-switch__track .jn-switch__thumb{ transform:translateX(16px); }
.jn-switch input:focus-visible + .jn-switch__track{ box-shadow:var(--shadow-ring); }
.jn-switch input:disabled + .jn-switch__track{ opacity:.5; }
[data-theme="dark"] .jn-switch__track{ background:var(--neutral-700); }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'switch');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function Switch({ label, disabled = false, className = '', ...rest }) {
  inject();
  return (
    <label className={['jn-switch', className].filter(Boolean).join(' ')}>
      <input type="checkbox" role="switch" disabled={disabled} {...rest} />
      <span className="jn-switch__track"><span className="jn-switch__thumb" /></span>
      {label && <span>{label}</span>}
    </label>
  );
}
