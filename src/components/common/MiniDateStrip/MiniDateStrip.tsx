'use client';

import { DatePicker } from '@/components/common/DatePicker';
import { FormField } from '@/components/common/FormField';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface MiniDateStripProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

// How far back the strip renders before handing off to the full calendar —
// most backdating is recent, so two weeks covers the common case without
// needing the picker at all.
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

/**
 * A natively scrollable day strip — every day in the recent window is always
 * in the DOM, so touch/trackpad swipe just works via the browser's own
 * scroll handling, and the arrows are a thin `scrollBy` wrapper around the
 * same mechanism rather than a second, parallel "which page am I on" state
 * machine. Visibility (for the arrow disabled-states and the "Selected: …"
 * hint) is derived from IntersectionObserver instead of manual scroll-offset
 * math, so it stays correct regardless of whether the scroll was driven by a
 * swipe, an arrow click, or a keyboard/focus jump.
 */
export function MiniDateStrip({ value, onChange, error, label = 'Date', required }: MiniDateStripProps) {
  const today = startOfDay(new Date());
  const oldestAllowed = addDays(today, -(RECENT_WINDOW_DAYS - 1));
  const todayIso = toISODate(today);
  const oldestIso = toISODate(oldestAllowed);
  const days = Array.from({ length: RECENT_WINDOW_DAYS }, (_, i) => addDays(oldestAllowed, i));

  const daysRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [visibleIsos, setVisibleIsos] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const root = daysRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIsos((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const iso = (entry.target as HTMLElement).dataset.iso;
            if (!iso) continue;
            if (entry.isIntersecting) next.add(iso);
            else next.delete(iso);
          }
          return next;
        });
      },
      { root, threshold: 0.9 },
    );
    cellRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayIso]);

  const parsedValue = parseISODate(value);
  const isValueVisible = Boolean(parsedValue) && visibleIsos.has(value);
  const atStart = visibleIsos.has(oldestIso);
  const atEnd = visibleIsos.has(todayIso);

  // Scroll the selected day into view on mount, and whenever it changes to a
  // day this strip can reach but isn't currently showing (e.g. prefilled
  // from an old transaction). A cell the user just tapped is already
  // visible, so this is a no-op for the common case.
  useEffect(() => {
    const target = cellRefs.current.get(value);
    if (!target || visibleIsos.has(value)) return;
    target.scrollIntoView({
      behavior: hasMountedRef.current ? 'smooth' : 'auto',
      inline: 'nearest',
      block: 'nearest',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useLayoutEffect(() => {
    hasMountedRef.current = true;
  }, []);

  function scrollByOneCell(direction: 1 | -1) {
    const root = daysRef.current;
    const cells = [...cellRefs.current.values()];
    if (!root || cells.length < 2) return;
    const step = Math.abs(cells[1].offsetLeft - cells[0].offsetLeft);
    root.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  function handleBack() {
    if (atStart) setPickerOpen(true);
    else scrollByOneCell(-1);
  }

  function handleForward() {
    scrollByOneCell(1);
  }

  // Always a non-empty string (falls back to a non-breaking space) so
  // FormField's hint line is always mounted at a fixed height — otherwise the
  // whole form jumps up/down every time this line mounts/unmounts while
  // scrolling the strip in and out of the selected day.
  const hint = parsedValue && !isValueVisible ? `Selected: ${formatCellLabel(parsedValue)}` : ' ';

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

        <div
          ref={daysRef}
          className="mini-date-strip__days"
          role="group"
          aria-label="Select a recent date"
        >
          {days.map((d) => {
            const iso = toISODate(d);
            const isActive = iso === value;
            return (
              <button
                key={iso}
                type="button"
                ref={(el) => {
                  if (el) cellRefs.current.set(iso, el);
                  else cellRefs.current.delete(iso);
                }}
                data-iso={iso}
                className={[
                  'mini-date-strip__day',
                  isActive && 'mini-date-strip__day--active',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onChange(iso)}
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
          disabled={atEnd}
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
            // Scroll (and optimistically mark visible) in the same handler as
            // the value change — waiting for the IntersectionObserver's own
            // async confirmation a render later flashes the "Selected: …"
            // hint for a frame before the strip catches up.
            const cell = cellRefs.current.get(iso);
            if (cell) {
              cell.scrollIntoView({ behavior: 'auto', inline: 'nearest', block: 'nearest' });
              setVisibleIsos((prev) => new Set(prev).add(iso));
            }
            onChange(iso);
          }}
          maxDate={todayIso}
        />
      </div>
    </FormField>
  );
}
