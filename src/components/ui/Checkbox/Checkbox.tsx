'use client';

import { useEffect, useRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: string;
  indeterminate?: boolean;
}

export function Checkbox({
  label,
  description,
  indeterminate = false,
  className = '',
  id,
  ...props
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const checkboxId = id ?? `checkbox-${String(label).toLowerCase().replace(/\s+/g, '-')}`;

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      htmlFor={checkboxId}
      className={['checkbox', props.disabled && 'checkbox--disabled', className]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        ref={inputRef}
        id={checkboxId}
        type="checkbox"
        className="checkbox__input"
        {...props}
      />
      <span className="checkbox__box" aria-hidden />
      <span className="checkbox__content">
        <span className="checkbox__label">{label}</span>
        {description && <span className="checkbox__description">{description}</span>}
      </span>
    </label>
  );
}
