'use client';

import { AlertCircle } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  badge,
  children,
  className = '',
  ...props
}: FormFieldProps) {
  return (
    <div
      className={['form-field', error && 'form-field--error', className].filter(Boolean).join(' ')}
      {...props}
    >
      <div className="form-field__label-row">
        <label htmlFor={htmlFor} className="form-field__label">
          {label}
          {required && (
            <span className="form-field__required" aria-hidden>
              *
            </span>
          )}
        </label>
        {badge && <span className="form-field__badge">{badge}</span>}
      </div>
      {children}
      {error && (
        <span className="form-field__error" role="alert">
          <AlertCircle size={12} aria-hidden />
          {error}
        </span>
      )}
      {!error && hint && <span className="form-field__hint">{hint}</span>}
    </div>
  );
}
