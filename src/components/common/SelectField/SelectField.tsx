'use client';

import { FormField } from '@/components/common/FormField';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'onChange'> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function SelectField({
  label,
  options,
  placeholder,
  error,
  hint,
  id,
  value,
  onChange,
  disabled,
  className = '',
  required,
  ...props
}: SelectFieldProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const allOptions = placeholder
    ? [{ value: '', label: placeholder, disabled: false }, ...options]
    : options;

  const selectedLabel =
    allOptions.find((o) => o.value === value)?.label ?? placeholder ?? '';

  function openDropdown() {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const maxH = 240;

    const openUpward = spaceBelow < maxH && spaceAbove > spaceBelow;

    setDropdownStyle(
      openUpward
        ? {
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            bottom: window.innerHeight - rect.top,
            maxHeight: Math.min(spaceAbove - 8, maxH),
          }
        : {
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            top: rect.bottom,
            maxHeight: Math.min(spaceBelow - 8, maxH),
          },
    );
    setOpen(true);
  }

  function select(optValue: string) {
    if (onChange) {
      const synthetic = {
        target: { value: optValue },
        currentTarget: { value: optValue },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(synthetic);
    }
    setOpen(false);
  }

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !listRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Keep a hidden native select in sync for form libraries / external value changes
  return (
    <FormField label={label} htmlFor={`${selectId}-btn`} error={error} hint={hint} required={required}>
      <div className="select-field">
        {/* Hidden native select keeps value in sync with any form library */}
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-hidden
          tabIndex={-1}
          className="select-field__native"
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom trigger */}
        <button
          ref={triggerRef}
          type="button"
          id={`${selectId}-btn`}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${selectId}-list`}
          aria-labelledby={`${selectId}-btn`}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          className={[
            'select-field__control',
            error && 'select-field__control--error',
            !value && 'select-field__control--placeholder',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={openDropdown}
        >
          <span className="select-field__value">{selectedLabel || placeholder}</span>
          <ChevronDown
            className={['select-field__icon', open && 'select-field__icon--open']
              .filter(Boolean)
              .join(' ')}
            size={16}
            aria-hidden
          />
        </button>

        {/* Portal-style fixed dropdown — escapes overflow:auto clipping */}
        {open && (
          <ul
            ref={listRef}
            id={`${selectId}-list`}
            role="listbox"
            aria-label={label}
            className="select-field__dropdown"
            style={dropdownStyle}
          >
            {allOptions.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                aria-disabled={opt.disabled}
                className={[
                  'select-field__option',
                  opt.value === value && 'select-field__option--selected',
                  opt.disabled && 'select-field__option--disabled',
                  !opt.value && 'select-field__option--placeholder',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click
                  if (!opt.disabled) select(opt.value);
                }}
              >
                {opt.label}
                {opt.value === value && <Check size={14} aria-hidden />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </FormField>
  );
}
