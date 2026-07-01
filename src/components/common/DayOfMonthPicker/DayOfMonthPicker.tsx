'use client';

/**
 * DayOfMonthPicker
 *
 * Reusable portal popover for picking a recurring day-of-month (1–31).
 * Designed to power both the budget due-date setter and the upcoming-payments
 * calendar — any feature that needs "which day of the month does this recur on".
 *
 * Architecture note: renders via ReactDOM.createPortal into document.body so it
 * escapes modal stacking contexts and CSS transforms on ancestor elements.
 * Position is computed via useLayoutEffect from the trigger's bounding rect.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface DayOfMonthPickerProps {
  /** Currently selected day (1–31), or null for unset. */
  value: number | null;
  /** Called with new day (1–31) or null when cleared. */
  onChange: (day: number | null) => void;
  /** Rendered as the clickable trigger. Receives open state. */
  trigger: (opts: {
    open: boolean;
    ref: React.RefObject<HTMLButtonElement | null>;
  }) => React.ReactNode;
  /** Today's day-of-month — used to highlight "today" in the grid. Defaults to current date. */
  todayDay?: number;
  /** Context label shown below the grid (e.g., "July"). */
  monthLabel?: string;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export function DayOfMonthPicker({
  value,
  onChange,
  trigger,
  todayDay = new Date().getDate(),
  monthLabel,
}: DayOfMonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Measure trigger after open commits to DOM
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const measure = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      // Prefer opening below; flip above if not enough space
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

  // Close on outside click or Escape
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

  function select(day: number) {
    onChange(day);
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setOpen(false);
  }

  return (
    <>
      {/* Trigger slot — consumer renders whatever button/chip they want */}
      <span onClick={() => setOpen((v) => !v)} style={{ display: 'contents' }}>
        {trigger({ open, ref: triggerRef })}
      </span>

      {/* Portal panel */}
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            className="dom-picker"
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
            role="dialog"
            aria-label="Pick day of month"
          >
            {/* Header */}
            <div className="dom-picker__header">
              <span className="dom-picker__title">Due on which day?</span>
              {value && (
                <span className="dom-picker__selected-label">
                  {value}
                  {ordinal(value)} of each month
                </span>
              )}
            </div>

            {/* Day grid — 7 columns */}
            <div className="dom-picker__grid" role="listbox">
              {DAYS.map((d) => {
                const isSelected = d === value;
                const isToday = d === todayDay;
                const isPast = d < todayDay;
                return (
                  <button
                    key={d}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={[
                      'dom-picker__day',
                      isSelected ? 'dom-picker__day--selected' : '',
                      isToday && !isSelected ? 'dom-picker__day--today' : '',
                      isPast && !isSelected ? 'dom-picker__day--past' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => select(d)}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="dom-picker__footer">
              {monthLabel && (
                <span className="dom-picker__month-hint">
                  Today is the {todayDay}
                  {ordinal(todayDay)} · {monthLabel}
                </span>
              )}
              {value ? (
                <button type="button" className="dom-picker__clear" onClick={clear}>
                  Clear due date
                </button>
              ) : (
                <span className="dom-picker__month-hint">No due date set</span>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
