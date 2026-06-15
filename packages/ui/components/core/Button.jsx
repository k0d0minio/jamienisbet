'use client';
import React from 'react';

const CSS = `
.jn-btn{
  --_h:38px; --_px:16px; --_fs:14px;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  height:var(--_h); padding:0 var(--_px); font-size:var(--_fs);
  font-family:var(--font-sans); font-weight:var(--weight-medium);
  letter-spacing:-0.005em; line-height:1; white-space:nowrap;
  border-radius:var(--radius-control); border:1px solid transparent;
  cursor:pointer; user-select:none; text-decoration:none;
  transition:var(--transition-control);
}
.jn-btn:focus-visible{ outline:none; box-shadow:var(--shadow-ring); }
.jn-btn:disabled,.jn-btn[aria-disabled="true"]{ opacity:.5; pointer-events:none; }
.jn-btn--sm{ --_h:32px; --_px:12px; --_fs:13px; }
.jn-btn--lg{ --_h:46px; --_px:22px; --_fs:15px; }
.jn-btn--block{ width:100%; }

.jn-btn--primary{ background:var(--primary); color:var(--primary-fg); }
.jn-btn--primary:hover{ background:var(--primary-hover); }
.jn-btn--primary:active{ background:var(--primary-active); }

.jn-btn--secondary{ background:var(--surface); color:var(--text-1); border-color:var(--border-strong); }
.jn-btn--secondary:hover{ background:var(--surface-2); border-color:var(--text-3); }
.jn-btn--secondary:active{ background:var(--surface-sunken); }

.jn-btn--ghost{ background:transparent; color:var(--text-2); }
.jn-btn--ghost:hover{ background:var(--surface-sunken); color:var(--text-1); }

.jn-btn--danger{ background:var(--danger); color:#fff; }
.jn-btn--danger:hover{ filter:brightness(0.94); }

.jn-btn__icon{ display:inline-flex; width:1.05em; height:1.05em; flex:none; }
.jn-btn__icon svg{ width:100%; height:100%; }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'button');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  leftIcon,
  rightIcon,
  as = 'button',
  className = '',
  children,
  ...rest
}) {
  inject();
  const Tag = as;
  const cls = [
    'jn-btn',
    `jn-btn--${variant}`,
    size !== 'md' ? `jn-btn--${size}` : '',
    block ? 'jn-btn--block' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag className={cls} {...rest}>
      {leftIcon && <span className="jn-btn__icon">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="jn-btn__icon">{rightIcon}</span>}
    </Tag>
  );
}
