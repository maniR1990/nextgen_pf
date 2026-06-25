'use client';

import {
  addMonths,
  format,
  getDay,
  getDaysInMonth,
  isSameDay,
  isToday,
  isValid,
  isWithinInterval,
  parseISO,
  startOfDay,
} from 'date-fns';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface DatePickerProps {
  value?: string | null;
  rangeStart?: string | null;
  rangeEnd?: string | null;
  mode?: 'single' | 'range';
  onChange?: (date: string | null) => void;
  onRangeChange?: (start: string | null, end: string | null) => void;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  label?: string;
  error?: string;
  clearable?: boolean;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function buildDays(year: number, month: number): (number | null)[] {
  const firstDay = getDay(new Date(year, month, 1));
  const total = getDaysInMonth(new Date(year, month, 1));
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= total; d++) days.push(d);
  return days;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return mobile;
}

export function DatePicker({
  value,
  rangeStart,
  rangeEnd,
  mode = 'single',
  onChange,
  onRangeChange,
  disabled = false,
  minDate,
  maxDate,
  placeholder = 'Select date',
  label,
  error,
  clearable = true,
}: DatePickerProps) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on outside click (desktop popover only)
  useEffect(() => {
    if (!open || isMobile) return;
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open, isMobile]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const parsedValue = value && isValid(parseISO(value)) ? parseISO(value) : null;
  const parsedStart = rangeStart && isValid(parseISO(rangeStart)) ? parseISO(rangeStart) : null;
  const parsedEnd = rangeEnd && isValid(parseISO(rangeEnd)) ? parseISO(rangeEnd) : null;
  const parsedMin = minDate ? parseISO(minDate) : null;
  const parsedMax = maxDate ? parseISO(maxDate) : null;

  function displayLabel(): string | null {
    if (mode === 'range') {
      if (parsedStart && parsedEnd)
        return `${format(parsedStart, 'MMM d, yyyy')} – ${format(parsedEnd, 'MMM d, yyyy')}`;
      if (parsedStart) return `${format(parsedStart, 'MMM d, yyyy')} – …`;
    }
    return parsedValue ? format(parsedValue, 'MMM d, yyyy') : null;
  }

  function isDisabled(d: Date) {
    if (parsedMin && d < startOfDay(parsedMin)) return true;
    if (parsedMax && d > startOfDay(parsedMax)) return true;
    return false;
  }

  function isInRange(d: Date) {
    if (mode !== 'range' || !parsedStart || !parsedEnd) return false;
    return isWithinInterval(d, { start: parsedStart, end: parsedEnd });
  }

  function handleDayClick(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    const iso = format(d, 'yyyy-MM-dd');
    if (mode === 'single') {
      onChange?.(iso);
      setOpen(false);
      return;
    }
    if (!parsedStart || (parsedStart && parsedEnd)) {
      onRangeChange?.(iso, null);
    } else if (d < parsedStart) {
      onRangeChange?.(iso, format(parsedStart, 'yyyy-MM-dd'));
    } else {
      onRangeChange?.(format(parsedStart, 'yyyy-MM-dd'), iso);
      setOpen(false);
    }
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    if (mode === 'single') {
      onChange?.(null);
    } else {
      onRangeChange?.(null, null);
    }
    setOpen(false);
  }

  function prevMonth() {
    const d = addMonths(new Date(viewYear, viewMonth, 1), -1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function nextMonth() {
    const d = addMonths(new Date(viewYear, viewMonth, 1), 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  const days = buildDays(viewYear, viewMonth);
  const displayText = displayLabel();
  const hasValue = mode === 'single' ? Boolean(parsedValue) : Boolean(parsedStart);
  const isCurrentView = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const calendarBody = (
    <>
      <div className="date-picker__nav">
        <button
          type="button"
          className="date-picker__nav-btn"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="date-picker__nav-label">
          {format(new Date(viewYear, viewMonth, 1), 'MMMM yyyy')}
        </span>
        <button
          type="button"
          className="date-picker__nav-btn"
          onClick={nextMonth}
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div
        className="date-picker__grid"
        role="grid"
        aria-label={format(new Date(viewYear, viewMonth, 1), 'MMMM yyyy')}
      >
        {WEEKDAYS.map((w) => (
          <div key={w} className="date-picker__weekday" role="columnheader">
            {w}
          </div>
        ))}
        {days.map((day, i) => {
          if (!day) {
            return (
              <div
                key={`e-${i}`}
                className="date-picker__day date-picker__day--empty"
                aria-hidden
              />
            );
          }
          const d = new Date(viewYear, viewMonth, day);
          const isRangeStart = mode === 'range' && parsedStart && isSameDay(d, parsedStart);
          const isRangeEnd = mode === 'range' && parsedEnd && isSameDay(d, parsedEnd);
          const isSelected =
            mode === 'single'
              ? parsedValue
                ? isSameDay(d, parsedValue)
                : false
              : Boolean(isRangeStart || isRangeEnd);
          const disabledDay = isDisabled(d);

          const classes = [
            'date-picker__day',
            isToday(d) ? 'date-picker__day--today' : '',
            isSelected ? 'date-picker__day--selected' : '',
            !isSelected && isInRange(d) ? 'date-picker__day--in-range' : '',
            isRangeStart ? 'date-picker__day--range-start' : '',
            isRangeEnd ? 'date-picker__day--range-end' : '',
            disabledDay ? 'date-picker__day--disabled' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={day}
              type="button"
              className={classes}
              role="gridcell"
              onClick={() => !disabledDay && handleDayClick(day)}
              aria-label={format(d, 'MMMM d, yyyy')}
              aria-pressed={isSelected}
              aria-disabled={disabledDay}
            >
              {day}
            </button>
          );
        })}
      </div>
    </>
  );

  const footerButtons = (
    <div className="date-picker__footer">
      {!isCurrentView && (
        <button type="button" className="date-picker__today-btn" onClick={goToToday}>
          Today
        </button>
      )}
      {mode === 'range' && parsedStart && !parsedEnd && (
        <span className="date-picker__hint">Select end date</span>
      )}
      <div style={{ flex: 1 }} />
      {mode === 'range' && (parsedStart || parsedEnd) && clearable && (
        <button
          type="button"
          className="btn btn--ghost date-picker__clear-btn"
          onClick={handleClear}
        >
          Clear range
        </button>
      )}
      {mode === 'range' && parsedStart && parsedEnd && (
        <button
          type="button"
          className="btn btn--primary date-picker__apply-btn"
          onClick={() => setOpen(false)}
        >
          Apply
        </button>
      )}
    </div>
  );

  const popover = (
    <div className="date-picker__popover" role="dialog" aria-modal aria-label="Date picker">
      {calendarBody}
      {footerButtons}
    </div>
  );

  const sheet = mounted
    ? createPortal(
        <div
          className="date-picker__overlay"
          role="dialog"
          aria-modal
          aria-label="Date picker"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="date-picker__sheet">
            <div className="date-picker__sheet-handle" />
            {calendarBody}
            <div className="date-picker__footer">
              {!isCurrentView && (
                <button type="button" className="date-picker__today-btn" onClick={goToToday}>
                  Today
                </button>
              )}
              <div style={{ flex: 1 }} />
              {mode === 'range' && parsedStart && parsedEnd && clearable && (
                <button
                  type="button"
                  className="btn btn--ghost date-picker__clear-btn"
                  onClick={handleClear}
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                className="btn btn--secondary"
                style={{ minWidth: 80 }}
                onClick={() => setOpen(false)}
              >
                {mode === 'range' && parsedStart && parsedEnd ? 'Apply' : 'Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  const triggerCls = [
    'date-picker__trigger',
    error ? 'date-picker__trigger--error' : '',
    disabled ? 'date-picker__trigger--disabled' : '',
    open ? 'date-picker__trigger--open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="date-picker" ref={containerRef}>
      {label && <label className="date-picker__label">{label}</label>}
      <button
        type="button"
        className={triggerCls}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarDays size={16} className="date-picker__trigger-icon" aria-hidden />
        <span
          className={`date-picker__trigger-text${!displayText ? ' date-picker__trigger-text--placeholder' : ''}`}
        >
          {displayText ?? placeholder}
        </span>
        {clearable && hasValue && (
          <span
            className="date-picker__clear-icon"
            role="button"
            aria-label="Clear date"
            onClick={handleClear}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleClear(e as unknown as React.MouseEvent);
            }}
          >
            <X size={14} />
          </span>
        )}
        <ChevronDown
          size={14}
          className={`date-picker__chevron${open ? ' date-picker__chevron--open' : ''}`}
          aria-hidden
        />
      </button>
      {error && (
        <span className="date-picker__error" role="alert">
          {error}
        </span>
      )}
      {open && !isMobile && popover}
      {open && isMobile && sheet}
    </div>
  );
}
