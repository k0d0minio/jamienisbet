'use client';
import React from 'react';

const CSS = `
.jn-tabs{ display:flex; gap:2px; border-bottom:1px solid var(--border); }
.jn-tab{
  position:relative; appearance:none; background:transparent; border:none;
  font-family:var(--font-sans); font-size:14px; font-weight:500; color:var(--text-3);
  padding:10px 14px; cursor:pointer; transition:color var(--duration-fast) var(--ease-out);
  border-bottom:2px solid transparent; margin-bottom:-1px; display:inline-flex; align-items:center; gap:7px;
}
.jn-tab:hover{ color:var(--text-1); }
.jn-tab--active{ color:var(--primary); border-bottom-color:var(--primary); }
.jn-tab:focus-visible{ outline:none; box-shadow:var(--shadow-ring); border-radius:var(--radius-xs); }
.jn-tab__count{ font-family:var(--font-mono); font-size:11px; color:var(--text-3); }
.jn-tab--active .jn-tab__count{ color:var(--primary); }
.jn-tab svg{ width:15px; height:15px; }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'tabs');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function Tabs({ items = [], value, onChange, className = '' }) {
  inject();
  return (
    <div className={['jn-tabs', className].filter(Boolean).join(' ')} role="tablist">
      {items.map(it => {
        const id = typeof it === 'string' ? it : it.value;
        const label = typeof it === 'string' ? it : it.label;
        const active = id === value;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            className={'jn-tab' + (active ? ' jn-tab--active' : '')}
            onClick={() => onChange && onChange(id)}
          >
            {typeof it === 'object' && it.icon}
            {label}
            {typeof it === 'object' && it.count != null && <span className="jn-tab__count">{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
