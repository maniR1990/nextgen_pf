'use client';

import { DatePicker } from '@/components/common/DatePicker';
import { FormField } from '@/components/common/FormField';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface MiniDateStripProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

const VISIBLE_DAYS = 5;
// How far back the strip itself will scroll before handing off to the full
// calendar — most backdating is recent, so two weeks covers the common case
// without needing the picker at all.
const RECENT_WINDOW_DAYS = 14;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
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
  return startOfDay(new Date(y, m - 1, d));
}

function formatCellLabel(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function MiniDateStrip({ value, onChange, error, label = 'Date', required }: MiniDateStripProps) {
  const today = startOfDay(new Date());
  const oldestAllowed = addDays(today, -(RECENT_WINDOW_DAYS - 1));
  const minWindowEnd = addDays(oldestAllowed, VISIBLE_DAYS - 1);

  function clampWindowEnd(d: Date): Date {
    if (d > today) return today;
    if (d < minWindowEnd) return minWindowEnd;
    return d;
  }

  const [windowEnd, setWindowEnd] = useState(() => {
    const parsed = parseISODate(value);
    return clampWindowEnd(parsed ?? today);
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  const visibleStart = addDays(windowEnd, -(VISIBLE_DAYS - 1));

  // Re-center the window only when the value has moved somewhere not currently
  // visible (e.g. prefilled from an old transaction, or just picked via the
  // fallback calendar) — clicking a day already on screen must not shift it.
  useEffect(() => {
    const parsed = parseISODate(value);
    if (!parsed) return;
    if (parsed >= visibleStart && parsed <= windowEnd) return;
    setWindowEnd(clampWindowEnd(parsed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const canGoForward = windowEnd < today;
  const canGoBackWithinWindow = visibleStart > oldestAllowed;

  function handleBack() {
    if (canGoBackWithinWindow) {
      setWindowEnd(addDays(windowEnd, -1));
    } else {
      setPickerOpen(true);
    }
  }

  function handleForward() {
    if (canGoForward) setWindowEnd(addDays(windowEnd, 1));
  }

  const visibleDates = Array.from({ length: VISIBLE_DAYS }, (_, i) => addDays(visibleStart, i));
  const parsedValue = parseISODate(value);
  const isValueVisible = Boolean(
    parsedValue && parsedValue >= visibleStart && parsedValue <= windowEnd,
  );
  // Always a non-empty string (falls back to a non-breaking space) so
  // FormField's hint line is always mounted at a fixed height — otherwise the
  // whole form jumps up/down every time this line mounts/unmounts while
  // scrolling the strip in and out of the selected day.
  const hint =
    !isValueVisible && parsedValue ? `Selected: ${formatCellLabel(parsedValue)}` : ' ';

  return (
    <FormField label={label} error={error} required={required} hint={hint}>
      <div className="mini-date-strip">
        <button
          type="button"
          className="mini-date-strip__arrow"
          onClick={handleBack}
          aria-label="Show earlier days"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>

        <div className="mini-date-strip__days" role="group" aria-label="Select a recent date">
          {visibleDates.map((d) => {
            const iso = toISODate(d);
            const isFuture = d > today;
            const isActive = iso === value;
            return (
              <button
                key={iso}
                type="button"
                className={[
                  'mini-date-strip__day',
                  isActive && 'mini-date-strip__day--active',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onChange(iso)}
                disabled={isFuture}
                aria-pressed={isActive}
                aria-label={formatCellLabel(d)}
              >
                <span className="mini-date-strip__month">
                  {d.toLocaleDateString('en-IN', { month: 'short' })}
                </span>
                <span className="mini-date-strip__num">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="mini-date-strip__arrow"
          onClick={handleForward}
          disabled={!canGoForward}
          aria-label="Show later days"
        >
          <ChevronRight size={16} aria-hidden />
        </button>

        <DatePicker
          hideTrigger
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          value={value}
          onChange={(iso) => {
            if (!iso) return;
            // Recenter in the same update as the value change — waiting for the
            // effect below to react a render later flashes the "Selected: …"
            // hint for one frame before the window catches up.
            const parsed = parseISODate(iso);
            if (parsed) setWindowEnd(clampWindowEnd(parsed));
            onChange(iso);
          }}
          maxDate={toISODate(today)}
        />
      </div>
    </FormField>
  );
}
