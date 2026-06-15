'use client';
import React from 'react';

const CSS = `
.jn-card{
  display:flex; flex-direction:column;
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--radius-card); color:var(--text-1);
}
.jn-card--pad{ padding:var(--space-5); }
.jn-card--hover{ transition:border-color var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out); }
.jn-card--hover:hover{ border-color:var(--border-strong); box-shadow:var(--shadow-md); transform:translateY(-2px); }
.jn-card--raised{ box-shadow:var(--shadow-sm); }
.jn-card--link{ cursor:pointer; text-decoration:none; }
.jn-card__head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:var(--space-4); }
.jn-card__title{ font-family:var(--font-sans); font-size:18px; font-weight:600; letter-spacing:-.01em; margin:0; color:var(--text-1); }
.jn-card__sub{ font-family:var(--font-mono); font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--text-3); margin:0 0 8px; }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-dsc', 'card');
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function Card({
  padded = true,
  hover = false,
  raised = false,
  eyebrow,
  title,
  action,
  as = 'div',
  className = '',
  children,
  ...rest
}) {
  inject();
  const Tag = as;
  const cls = [
    'jn-card',
    padded ? 'jn-card--pad' : '',
    hover ? 'jn-card--hover' : '',
    raised ? 'jn-card--raised' : '',
    as === 'a' ? 'jn-card--link' : '',
    className,
  ].filter(Boolean).join(' ');

  const hasHead = title || action;
  return (
    <Tag className={cls} {...rest}>
      {eyebrow && <p className="jn-card__sub">{eyebrow}</p>}
      {hasHead && (
        <div className="jn-card__head">
          {title && <h3 className="jn-card__title">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </Tag>
  );
}
