'use client';

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export interface MonthNavControlProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
}

export function MonthNavControl({
  label,
  onPrev,
  onNext,
  disablePrev = false,
  disableNext = false,
}: MonthNavControlProps) {
  return (
    <div className="month-nav-control" role="group" aria-label="Report period navigation">
      <button
        type="button"
        className="month-nav-control__btn"
        onClick={onPrev}
        disabled={disablePrev}
        aria-label="Previous month"
      >
        <ChevronLeft size={14} aria-hidden />
      </button>

      <span className="month-nav-control__label">
        <Calendar size={13} aria-hidden className="month-nav-control__cal-icon" />
        {label}
      </span>

      <button
        type="button"
        className="month-nav-control__btn"
        onClick={onNext}
        disabled={disableNext}
        aria-label="Next month"
      >
        <ChevronRight size={14} aria-hidden />
      </button>
    </div>
  );
}
