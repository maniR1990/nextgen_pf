'use client';

/**
 * FrequencyPicker
 *
 * Reusable portal popover for picking a recurring cadence (Off / Monthly / Twice
 * monthly / Every 2 months / Quarterly / Half-yearly / Annual).
 *
 * Deliberately a compact trigger + floating panel rather than an inline <select> —
 * a permanently-visible native select showing e.g. "Half-yearly" is wide enough to
 * overlap neighboring grid columns on rows that already carry several badges. The
 * panel floats above the layout instead, so it never affects row width.
 *
 * Architecture mirrors DayOfMonthPicker: portal into document.body, position from
 * the trigger's bounding rect, close on outside click or Escape.
 */

import type { RecurringFrequency } from '@prisma/client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface FrequencyPickerProps {
  /** Currently selected frequency, or null for "not recurring". */
  value: RecurringFrequency | null;
  /** Called with the new frequency, or null when cleared to "off". */
  onChange: (frequency: RecurringFrequency | null) => void;
  /** Rendered as the clickable trigger. Receives open state. */
  trigger: (opts: {
    open: boolean;
    ref: React.RefObject<HTMLButtonElement | null>;
  }) => React.ReactNode;
}

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'TWICE_MONTHLY', label: 'Twice monthly' },
  { value: 'EVERY_2_MONTHS', label: 'Every 2 months' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'HALF_YEARLY', label: 'Half-yearly' },
  { value: 'ANNUAL', label: 'Annual' },
];

export function FrequencyPicker({ value, onChange, trigger }: FrequencyPickerProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const measure = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const panelH = 260;
      const top =
        rect.bottom + window.innerHeight - rect.bottom > panelH
          ? rect.bottom + 6
          : rect.top - panelH - 6;
      setPos({ top, left: rect.left });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onOutside);
    };
  }, [open]);

  function select(frequency: RecurringFrequency) {
    onChange(frequency);
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setOpen(false);
  }

  return (
    <>
      <span onClick={() => setOpen((v) => !v)} style={{ display: 'contents' }}>
        {trigger({ open, ref: triggerRef })}
      </span>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            className="freq-picker"
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
            role="dialog"
            aria-label="Pick recurring frequency"
          >
            <div className="freq-picker__header">
              <span className="freq-picker__title">How often?</span>
            </div>

            <div className="freq-picker__list" role="listbox">
              {FREQUENCIES.map((f) => {
                const isSelected = f.value === value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={[
                      'freq-picker__option',
                      isSelected ? 'freq-picker__option--selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => select(f.value)}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="freq-picker__footer">
              {value ? (
                <button type="button" className="freq-picker__clear" onClick={clear}>
                  Turn off recurring
                </button>
              ) : (
                <span className="freq-picker__hint">Not recurring</span>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
