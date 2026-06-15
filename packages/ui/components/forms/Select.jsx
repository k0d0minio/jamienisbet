'use client';
import React from 'react';

const CSS = `
.jn-sel-field{ display:flex; flex-direction:column; gap:6px; }
.jn-sel-field__label{ font-family:var(--font-sans); font-size:13px; font-weight:500; color:var(--text-1); }
.jn-sel-wrap{ position:relative; display:flex; align-items:center; }
.jn-select{
  appearance:none; width:100%; height:38px; padding:0 36px 0 12px;
  font-family:var(--font-sans); font-size:14px; color:var(--text-1);
  background:var(--surface); border:1px solid var(--border-strong);
  border-radius:var(--radius-control); transition:var(--transition-control);
  outline:none; cursor:pointer;
}
.jn-select:hover{ border-color:var(--text-3); }
.jn-select:focus{ border-color:var(--border-focus); box-shadow:var(--shadow-ring); }
.jn-select:disabled{ opacity:.55; background:var(--surface-sunken); cursor:not-allowed; }
.jn-sel-caret{ position:absolute; right:12px; pointer-events:none; color:var(--text-3);
  width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent;
  border-top:5px solid currentColor; }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'select');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function Select({ label, options = [], placeholder, id, className = '', children, ...rest }) {
  inject();
  const fid = id || (label ? 'jn-sel-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <div className="jn-sel-field">
      {label && <label className="jn-sel-field__label" htmlFor={fid}>{label}</label>}
      <div className="jn-sel-wrap">
        <select id={fid} className={['jn-select', className].filter(Boolean).join(' ')} {...rest}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(o => {
            const val = typeof o === 'string' ? o : o.value;
            const lab = typeof o === 'string' ? o : o.label;
            return <option key={val} value={val}>{lab}</option>;
          })}
          {children}
        </select>
        <span className="jn-sel-caret" />
      </div>
    </div>
  );
}
