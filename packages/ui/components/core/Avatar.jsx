'use client';
import React from 'react';

const CSS = `
.jn-avatar{
  display:inline-flex; align-items:center; justify-content:center;
  width:var(--_s,40px); height:var(--_s,40px); flex:none;
  border-radius:50%; overflow:hidden; background:var(--primary-soft);
  color:var(--primary-soft-fg); font-family:var(--font-sans);
  font-weight:600; font-size:calc(var(--_s,40px) * 0.38); letter-spacing:-.01em;
  border:1px solid var(--border); user-select:none;
}
.jn-avatar img{ width:100%; height:100%; object-fit:cover; }
.jn-avatar--square{ border-radius:var(--radius-md); }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'avatar');
  s.textContent = CSS;
  document.head.appendChild(s);
}

const SIZES = { sm: 28, md: 40, lg: 56, xl: 80 };

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
}

export function Avatar({ src, name = '', size = 'md', square = false, className = '', style, ...rest }) {
  inject();
  const px = SIZES[size] || size;
  const cls = ['jn-avatar', square ? 'jn-avatar--square' : '', className].filter(Boolean).join(' ');
  return (
    <span className={cls} style={{ '--_s': px + 'px', ...style }} {...rest}>
      {src ? <img src={src} alt={name} /> : initials(name)}
    </span>
  );
}
