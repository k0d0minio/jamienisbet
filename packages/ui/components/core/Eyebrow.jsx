'use client';
import React from 'react';

const CSS = `
.jn-eyebrow{
  display:inline-flex; align-items:center; gap:8px;
  font-family:var(--font-mono); font-size:11px; font-weight:500;
  letter-spacing:.12em; text-transform:uppercase; color:var(--text-3);
  line-height:1;
}
.jn-eyebrow--rule::before{
  content:""; width:24px; height:1px; background:var(--border-strong); flex:none;
}
.jn-eyebrow--primary{ color:var(--primary); }
.jn-eyebrow__index{ color:var(--text-1); }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'eyebrow');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function Eyebrow({ rule = false, primary = false, index, className = '', children, ...rest }) {
  inject();
  const cls = [
    'jn-eyebrow',
    rule ? 'jn-eyebrow--rule' : '',
    primary ? 'jn-eyebrow--primary' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <span className={cls} {...rest}>
      {index != null && <span className="jn-eyebrow__index">{index}</span>}
      {children}
    </span>
  );
}
