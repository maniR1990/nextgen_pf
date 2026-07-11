'use client';

import { FormField } from '@/components/common/FormField';
import { QUICK_AMOUNT_CHIPS } from '@/constants/finance';
import type { InputHTMLAttributes } from 'react';

export interface AmountInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  label?: string;
  showChips?: boolean;
}

export function AmountInput({
  value,
  onChange,
  error,
  hint,
  label = 'AMOUNT (₹)',
  showChips = true,
  disabled,
  required,
  ...props
}: AmountInputProps) {
  const handleChip = (chip: number) => {
    const current = Number.parseFloat(value) || 0;
    onChange(String(current + chip));
  };

  return (
    <FormField label={label} htmlFor="tx-amount" error={error} hint={hint} required={required}>
      <div className="amount-input">
        <span className="amount-input__prefix" aria-hidden>
          ₹
        </span>
        <input
          id="tx-amount"
          type="number"
          min="0"
          step="0.01"
          className={['amount-input__control', error && 'amount-input__control--error']
            .filter(Boolean)
            .join(' ')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          disabled={disabled}
          required={required}
          aria-label="Transaction amount in rupees"
          {...props}
        />
      </div>
      {showChips && (
        <>
          <p className="amount-input__chips-label">Quick amounts</p>
          <div className="amount-input__chips" role="group" aria-label="Quick amount shortcuts">
            {QUICK_AMOUNT_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                className="amount-input__chip"
                onClick={() => handleChip(chip.value)}
                disabled={disabled}
                aria-label={`Add ₹${chip.label}`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </>
      )}
    </FormField>
  );
}
