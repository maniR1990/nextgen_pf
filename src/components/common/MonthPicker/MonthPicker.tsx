'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface MonthPickerProps {
  value?: { month: number; year: number } | null;
  onChange?: (value: { month: number; year: number }) => void;
  onClear?: () => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  minYear?: number;
  maxYear?: number;
  /** Zero-based month indices to disable (0 = Jan) */
  disabledMonths?: number[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MonthPicker({
  value,
  onChange,
  onClear,
  label,
  placeholder = 'Select month',
  disabled = false,
  clearable = true,
  minYear,
  maxYear,
  disabledMonths = [],
}: MonthPickerProps) {
  const today = new Date();
  const [year, setYear] = useState(value?.year ?? today.getFullYear());

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onClear?.();
  }

  function canGoBack() {
    return minYear == null || year - 1 >= minYear;
  }

  function canGoForward() {
    return maxYear == null || year + 1 <= maxYear;
  }

  function isMonthDisabled(monthIdx: number) {
    if (disabledMonths.includes(monthIdx)) return true;
    if (minYear != null && year === minYear) {
      // Could further restrict by min month if needed
    }
    if (maxYear != null && year === maxYear) {
      // e.g., can't go beyond current month in current year
    }
    return false;
  }

  return (
    <div className={`month-picker${disabled ? ' month-picker--disabled' : ''}`}>
      {label && <div className="month-picker__label">{label}</div>}

      <div className="month-picker__nav">
        <button
          type="button"
          className="month-picker__nav-btn"
          onClick={() => canGoBack() && setYear(y => y - 1)}
          disabled={!canGoBack() || disabled}
          aria-label="Previous year"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="month-picker__year">{year}</span>
        <button
          type="button"
          className="month-picker__nav-btn"
          onClick={() => canGoForward() && setYear(y => y + 1)}
          disabled={!canGoForward() || disabled}
          aria-label="Next year"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="month-picker__grid" role="grid" aria-label={`Month picker ${year}`}>
        {MONTHS.map((m, i) => {
          const isSelected = value?.month === i + 1 && value?.year === year;
          const isCurrent = today.getMonth() === i && today.getFullYear() === year;
          const isDisabled = isMonthDisabled(i) || disabled;
          const cls = [
            'month-picker__month',
            isSelected ? 'month-picker__month--selected' : '',
            isCurrent ? 'month-picker__month--current' : '',
            isDisabled ? 'month-picker__month--disabled' : '',
          ].filter(Boolean).join(' ');
          return (
            <button
              key={m}
              type="button"
              className={cls}
              aria-pressed={isSelected}
              aria-label={`${m} ${year}`}
              disabled={isDisabled}
              onClick={() => !isDisabled && onChange?.({ month: i + 1, year })}
            >
              {m}
            </button>
          );
        })}
      </div>

      <div className="month-picker__footer">
        {value ? (
          <>
            <span className="month-picker__selected-label">
              {MONTHS[value.month - 1]} {value.year}
            </span>
            {clearable && (
              <button
                type="button"
                className="month-picker__clear-btn"
                onClick={handleClear}
                aria-label="Clear selection"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </>
        ) : (
          <span className="month-picker__placeholder">{placeholder}</span>
        )}
      </div>
    </div>
  );
}
