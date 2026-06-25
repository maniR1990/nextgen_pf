'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: string;
}

export function Toggle({ label, description, className = '', id, ...props }: ToggleProps) {
  const toggleId = id ?? `toggle-${String(label).toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <label
      htmlFor={toggleId}
      className={['toggle', props.disabled && 'toggle--disabled', className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="toggle__content">
        <span className="toggle__label">{label}</span>
        {description && <span className="toggle__description">{description}</span>}
      </span>
      <input id={toggleId} type="checkbox" role="switch" className="toggle__input" {...props} />
      <span className="toggle__track" aria-hidden>
        <span className="toggle__thumb" />
      </span>
    </label>
  );
}
