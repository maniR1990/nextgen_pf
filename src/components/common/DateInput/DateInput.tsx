'use client';

import { FormField } from '@/components/common/FormField';
import { Calendar } from 'lucide-react';
import { useRef } from 'react';

export interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function quickDates(): { label: string; value: string }[] {
  const today = new Date();
  return ['Today', 'Yesterday', '2 days ago'].map((label, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return { label, value: toISODate(d) };
  });
}

// Type lib DOM doesn't universally include showPicker() yet on all TS targets.
type DateInputElement = HTMLInputElement & { showPicker?: () => void };

/**
 * Replaces the plain date box with a single row of chips — Today / Yesterday /
 * 2 days ago cover the vast majority of entries with one tap, and the last
 * chip doubles as the "anything else" trigger: it launches the native date
 * picker via a hidden input (same hidden-native-control pattern as
 * SelectField) instead of adding a second row for a calendar control.
 */
export function DateInput({ value, onChange, error, label = 'Date', required }: DateInputProps) {
  const nativeRef = useRef<DateInputElement>(null);
  const chips = quickDates();
  const isQuickDate = chips.some((c) => c.value === value);
  const parsedValue = parseISODate(value);

  function openPicker() {
    const el = nativeRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
        return;
      } catch {
        // Some browsers throw if the picker can't be shown (e.g. not user-triggered) —
        // fall back to a plain focus so the field is at least keyboard-reachable.
      }
    }
    el.focus();
  }

  return (
    <FormField label={label} htmlFor="tx-date-picker-trigger" error={error} required={required}>
      <div className="date-input">
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            className={['date-input__chip', value === chip.value && 'date-input__chip--active']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(chip.value)}
            aria-pressed={value === chip.value}
          >
            {chip.label}
          </button>
        ))}
        <button
          type="button"
          id="tx-date-picker-trigger"
          className={[
            'date-input__chip',
            'date-input__chip--picker',
            !isQuickDate && parsedValue && 'date-input__chip--active',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={openPicker}
          aria-label="Pick a date"
        >
          <Calendar size={14} aria-hidden />
          {!isQuickDate && parsedValue && (
            <span>{parsedValue.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
          )}
        </button>
        <input
          ref={nativeRef}
          type="date"
          className="date-input__native"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </FormField>
  );
}
