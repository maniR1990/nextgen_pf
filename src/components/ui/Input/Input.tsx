'use client';

import type { InputHTMLAttributes } from 'react';
import { FieldMessage } from '@/components/ui/FieldMessage';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  /** Error border without showing a message (e.g. form-level validation) */
  invalid?: boolean;
  fullWidth?: boolean;
  /** Storybook / Chromatic snapshots only */
  visualState?: 'focus';
}

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-');
}

export function inputClassName({
  error,
  invalid,
  success,
  className = '',
}: {
  error?: string;
  invalid?: boolean;
  success?: string;
  className?: string;
}) {
  return [
    'input-field__control',
    (error || invalid) && 'input-field__control--error',
    !error && success && 'input-field__control--success',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function Input({
  label,
  hint,
  error,
  invalid,
  success,
  fullWidth = true,
  visualState,
  className = '',
  id,
  disabled,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? slugify(label) : undefined);
  const hintId = hint && inputId ? `${inputId}-hint` : undefined;
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const successId = success && inputId ? `${inputId}-success` : undefined;
  const describedBy = [hintId, errorId, successId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={['input-field', fullWidth && 'input-field--full'].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={inputId} className="input-field__label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        disabled={disabled}
        aria-invalid={error || invalid ? true : undefined}
        aria-describedby={describedBy}
        data-state={visualState}
        className={inputClassName({ error, invalid, success, className })}
        {...props}
      />
      {error ? (
        <FieldMessage tone="error" id={errorId}>
          {error}
        </FieldMessage>
      ) : success ? (
        <FieldMessage tone="success" id={successId}>
          {success}
        </FieldMessage>
      ) : hint ? (
        <FieldMessage tone="hint" id={hintId}>
          {hint}
        </FieldMessage>
      ) : null}
    </div>
  );
}
