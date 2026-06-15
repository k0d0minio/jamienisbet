'use client';
import React from 'react';

const CSS = `
.jn-field{ display:flex; flex-direction:column; gap:6px; }
.jn-field__label{ font-family:var(--font-sans); font-size:13px; font-weight:500; color:var(--text-1); }
.jn-field__hint{ font-family:var(--font-sans); font-size:12px; color:var(--text-3); }
.jn-field__hint--err{ color:var(--danger); }
.jn-input-wrap{ position:relative; display:flex; align-items:center; }
.jn-input{
  width:100%; height:38px; padding:0 12px; font-family:var(--font-sans);
  font-size:14px; color:var(--text-1); background:var(--surface);
  border:1px solid var(--border-strong); border-radius:var(--radius-control);
  transition:var(--transition-control); outline:none;
}
.jn-input::placeholder{ color:var(--text-3); }
.jn-input:hover{ border-color:var(--text-3); }
.jn-input:focus{ border-color:var(--border-focus); box-shadow:var(--shadow-ring); }
.jn-input:disabled{ opacity:.55; cursor:not-allowed; background:var(--surface-sunken); }
.jn-input--err{ border-color:var(--danger); }
.jn-input--err:focus{ box-shadow:0 0 0 3px var(--danger-soft); }
.jn-input--has-l{ padding-left:38px; }
.jn-input--has-r{ padding-right:38px; }
.jn-input__icon{ position:absolute; display:inline-flex; color:var(--text-3); pointer-events:none; }
.jn-input__icon svg{ width:16px; height:16px; }
.jn-input__icon--l{ left:12px; }
.jn-input__icon--r{ right:12px; }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'input');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function Input({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  id,
  className = '',
  ...rest
}) {
  inject();
  const fid = id || (label ? 'jn-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const inputCls = [
    'jn-input',
    error ? 'jn-input--err' : '',
    leftIcon ? 'jn-input--has-l' : '',
    rightIcon ? 'jn-input--has-r' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="jn-field">
      {label && <label className="jn-field__label" htmlFor={fid}>{label}</label>}
      <div className="jn-input-wrap">
        {leftIcon && <span className="jn-input__icon jn-input__icon--l">{leftIcon}</span>}
        <input id={fid} className={inputCls} aria-invalid={!!error} {...rest} />
        {rightIcon && <span className="jn-input__icon jn-input__icon--r">{rightIcon}</span>}
      </div>
      {(error || hint) && (
        <span className={'jn-field__hint' + (error ? ' jn-field__hint--err' : '')}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
