'use client';

import type { HTMLAttributes, MouseEvent } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  current?: boolean;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

function BreadcrumbSeparator() {
  return (
    <span className="breadcrumb__separator" aria-hidden>
      ›
    </span>
  );
}

export function breadcrumbClassName({ className = '' }: { className?: string } = {}) {
  return ['breadcrumb', className].filter(Boolean).join(' ');
}

export function Breadcrumb({ items, className = '', ...props }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" {...props}>
      <ol className={breadcrumbClassName({ className })}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = item.current ?? isLast;

          return (
            <li key={`${item.label}-${index}`} className="breadcrumb__item">
              {isCurrent ? (
                <span className="breadcrumb__current" aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <a className="breadcrumb__link" href={item.href} onClick={item.onClick}>
                  {item.label}
                </a>
              ) : (
                <button type="button" className="breadcrumb__link" onClick={item.onClick}>
                  {item.label}
                </button>
              )}
              {!isLast && <BreadcrumbSeparator />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
