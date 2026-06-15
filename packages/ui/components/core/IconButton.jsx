'use client';
import React from 'react';

const CSS = `
.jn-iconbtn{
  --_s:38px;
  display:inline-flex; align-items:center; justify-content:center;
  width:var(--_s); height:var(--_s); padding:0; flex:none;
  border-radius:var(--radius-control); border:1px solid transparent;
  background:transparent; color:var(--text-2); cursor:pointer;
  transition:var(--transition-control);
}
.jn-iconbtn:hover{ background:var(--surface-sunken); color:var(--text-1); }
.jn-iconbtn:focus-visible{ outline:none; box-shadow:var(--shadow-ring); }
.jn-iconbtn:disabled{ opacity:.5; pointer-events:none; }
.jn-iconbtn--sm{ --_s:32px; }
.jn-iconbtn--lg{ --_s:46px; }
.jn-iconbtn--solid{ background:var(--primary); color:var(--primary-fg); }
.jn-iconbtn--solid:hover{ background:var(--primary-hover); color:var(--primary-fg); }
.jn-iconbtn--outline{ border-color:var(--border-strong); }
.jn-iconbtn--outline:hover{ border-color:var(--text-3); }
.jn-iconbtn svg{ width:1.15em; height:1.15em; display:block; }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'iconbutton');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  label,
  className = '',
  children,
  ...rest
}) {
  inject();
  const cls = [
    'jn-iconbtn',
    variant !== 'ghost' ? `jn-iconbtn--${variant}` : '',
    size !== 'md' ? `jn-iconbtn--${size}` : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}
