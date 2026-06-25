'use client';

import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { FormField } from '@/components/common/FormField';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
}

export function SelectField({ label, options, placeholder, error, hint, id, className = '', ...props }: SelectFieldProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <FormField label={label} htmlFor={selectId} error={error} hint={hint}>
      <div className="select-field">
        <select
          id={selectId}
          className={['select-field__control', error && 'select-field__control--error', className].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="select-field__icon" size={16} aria-hidden />
      </div>
    </FormField>
  );
}
