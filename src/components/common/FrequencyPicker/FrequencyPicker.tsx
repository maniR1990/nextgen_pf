'use client';

/**
 * FrequencyPicker
 *
 * Reusable portal popover for picking a recurring cadence (Off / Monthly / Twice
 * monthly / Every 2 months / Quarterly / Half-yearly / Annual) and, for anything
 * other than Monthly, WHICH calendar month(s) it's actually due in.
 *
 * Two steps in one popover:
 *  1. "frequency" — pick the cadence. Monthly resolves immediately (every month,
 *     no due-months needed). Anything else advances to step 2.
 *  2. "anchor" — pick the month the item is next/first due. The rest of the due
 *     months are evenly spaced from that anchor (e.g. anchor=March + Half-yearly
 *     → March, September) via monthsFromAnchor, so the user only ever answers
 *     "which month", not "which N months" — the spacing is definitionally even.
 *
 * Architecture mirrors DayOfMonthPicker: portal into document.body, position from
 * the trigger's bounding rect, close on outside click or Escape.
 */

import { MONTH_LABELS_SHORT, monthsFromAnchor } from '@/lib/utils/recurringFrequency';
import type { RecurringFrequency } from '@prisma/client';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface FrequencyPickerProps {
  /** Currently selected frequency, or null for "not recurring". */
  value: RecurringFrequency | null;
  /** Currently selected due-months (1-12), if any — used to highlight the current anchor. */
  months?: number[];
  /** Called with the new frequency and its resolved due-months (empty for Monthly/off). */
  onChange: (frequency: RecurringFrequency | null, months: number[]) => void;
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

type Step = 'frequency' | 'anchor';

export function FrequencyPicker({ value, months = [], onChange, trigger }: FrequencyPickerProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('frequency');
  const [pendingFrequency, setPendingFrequency] = useState<RecurringFrequency | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Always reopen on the frequency list, not wherever the popover was left last time.
  useEffect(() => {
    if (open) {
      setStep('frequency');
      setPendingFrequency(null);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const measure = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const panelH = 280;
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
  }, [open, step]);

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

  function selectFrequency(frequency: RecurringFrequency) {
    if (frequency === 'MONTHLY') {
      onChange('MONTHLY', []);
      setOpen(false);
      return;
    }
    setPendingFrequency(frequency);
    setStep('anchor');
  }

  function selectAnchor(anchorMonth: number) {
    if (!pendingFrequency) return;
    onChange(pendingFrequency, monthsFromAnchor(pendingFrequency, anchorMonth));
    setOpen(false);
  }

  function clear() {
    onChange(null, []);
    setOpen(false);
  }

  const anchorFrequency = pendingFrequency ?? value;
  const currentAnchor = months.length > 0 ? months[0] : new Date().getMonth() + 1;
  const anchorLabel = anchorFrequency
    ? FREQUENCIES.find((f) => f.value === anchorFrequency)?.label
    : '';

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
            aria-label={step === 'frequency' ? 'Pick recurring frequency' : 'Pick due month'}
          >
            {step === 'frequency' ? (
              <>
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
                        onClick={() => selectFrequency(f.value)}
                      >
                        {f.label}
                        {isSelected && f.value !== 'MONTHLY' && months.length > 0 && (
                          <span className="freq-picker__option-months">
                            {months.map((m) => MONTH_LABELS_SHORT[m - 1]).join(', ')}
                          </span>
                        )}
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
              </>
            ) : (
              <>
                <div className="freq-picker__header freq-picker__header--anchor">
                  <button
                    type="button"
                    className="freq-picker__back"
                    onClick={() => setStep('frequency')}
                    aria-label="Back to frequency"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="freq-picker__title">
                    {anchorLabel} — which month?
                  </span>
                </div>

                <div className="freq-picker__months" role="listbox" aria-label="Due month">
                  {MONTH_LABELS_SHORT.map((label, i) => {
                    const monthNum = i + 1;
                    const isSelected = months.includes(monthNum) || currentAnchor === monthNum;
                    return (
                      <button
                        key={label}
                        type="button"
                        role="option"
                        aria-selected={months.includes(monthNum)}
                        className={[
                          'freq-picker__month',
                          months.includes(monthNum) ? 'freq-picker__month--selected' : '',
                          !months.length && isSelected ? 'freq-picker__month--suggested' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => selectAnchor(monthNum)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="freq-picker__footer">
                  <span className="freq-picker__hint">
                    Pick the first due month — the rest are spaced evenly from there.
                  </span>
                </div>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
