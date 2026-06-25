'use client';

import { format, getDay, getDaysInYear, parseISO, startOfYear } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

const CELL_SIZE = 12;
const GAP = 3;
const STRIDE = CELL_SIZE + GAP; // pixels per column

export interface HeatmapDay {
  date: string;
  amount: number;
}

export interface YearHeatmapProps {
  year?: number;
  data: HeatmapDay[];
  onDayClick?: (date: string, amount: number) => void;
  onYearChange?: (year: number) => void;
  loading?: boolean;
  /** 'expense' (red), 'income' (green), 'savings' (blue). Default: 'expense' */
  colorScheme?: 'expense' | 'income' | 'savings';
  minYear?: number;
  maxYear?: number;
}

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function getLevel(amount: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (amount === 0 || max === 0) return 0;
  const ratio = amount / max;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

export function YearHeatmap({
  year: yearProp,
  data,
  onDayClick,
  onYearChange,
  loading = false,
  colorScheme = 'expense',
  minYear,
  maxYear,
}: YearHeatmapProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(yearProp ?? currentYear);
  const [tooltip, setTooltip] = useState<{
    date: string;
    amount: number;
    x: number;
    y: number;
  } | null>(null);

  function changeYear(next: number) {
    setYear(next);
    onYearChange?.(next);
  }

  const { cells, monthColOffsets, monthTotals, totalSpend, activeDays } = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) map.set(d.date, d.amount);

    const start = startOfYear(new Date(year, 0, 1));
    const totalDays = getDaysInYear(start);
    const startOffset = getDay(start);

    const allCells: { date: string | null; amount: number }[] = [];
    for (let i = 0; i < startOffset; i++) allCells.push({ date: null, amount: 0 });

    const offsets: number[] = [];
    const totals: number[] = Array(12).fill(0);
    let currentMonth = -1;
    let totalSpend = 0;
    let activeDays = 0;

    for (let d = 0; d < totalDays; d++) {
      const date = new Date(year, 0, d + 1);
      const iso = format(date, 'yyyy-MM-dd');
      const amount = map.get(iso) ?? 0;
      const month = date.getMonth();
      const cellIdx = startOffset + d;

      if (month !== currentMonth) {
        offsets.push(Math.floor(cellIdx / 7));
        currentMonth = month;
      }
      totals[month] += amount;
      totalSpend += amount;
      if (amount > 0) activeDays++;
      allCells.push({ date: iso, amount });
    }

    const max = Math.max(...data.map((d) => d.amount), 0);
    return {
      cells: allCells.map((c) => ({ ...c, level: getLevel(c.amount, max) })),
      monthColOffsets: offsets,
      monthTotals: totals,
      totalSpend,
      activeDays,
    };
  }, [year, data]);

  const maxTotal = Math.max(...monthTotals, 0);
  const totalWeeks = Math.ceil(cells.length / 7);

  if (loading) {
    return (
      <div className={`year-heatmap year-heatmap--${colorScheme}`} aria-label="Loading heatmap">
        <div className="year-heatmap__skeleton" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={`year-heatmap year-heatmap--${colorScheme}`}
      aria-label={`Spending heatmap for ${year}`}
    >
      {/* Header: year nav + summary stats */}
      <div className="year-heatmap__header">
        <div className="year-heatmap__year-nav">
          <button
            type="button"
            className="year-heatmap__nav-btn"
            onClick={() => changeYear(year - 1)}
            disabled={minYear != null && year - 1 < minYear}
            aria-label="Previous year"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="year-heatmap__title">{year}</span>
          <button
            type="button"
            className="year-heatmap__nav-btn"
            onClick={() => changeYear(year + 1)}
            disabled={maxYear != null && year + 1 > maxYear}
            aria-label="Next year"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="year-heatmap__stats">
          <span className="year-heatmap__stat">
            <span className="year-heatmap__stat-label">Total</span>
            <span className="year-heatmap__stat-value">₹{totalSpend.toLocaleString('en-IN')}</span>
          </span>
          <span className="year-heatmap__stat">
            <span className="year-heatmap__stat-label">Active days</span>
            <span className="year-heatmap__stat-value">{activeDays}</span>
          </span>
          {activeDays > 0 && (
            <span className="year-heatmap__stat">
              <span className="year-heatmap__stat-label">Avg/day</span>
              <span className="year-heatmap__stat-value">
                ₹{Math.round(totalSpend / activeDays).toLocaleString('en-IN')}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Desktop grid + month labels */}
      <div className="year-heatmap__grid-wrap">
        <div
          className="year-heatmap__grid"
          style={{ gridTemplateColumns: `repeat(${totalWeeks}, ${CELL_SIZE}px)` }}
          role="grid"
        >
          {cells.map((cell, i) => {
            if (!cell.date) {
              return (
                <div
                  key={`e-${i}`}
                  className="year-heatmap__cell year-heatmap__cell--l0"
                  aria-hidden
                />
              );
            }
            return (
              <button
                key={cell.date}
                type="button"
                className={`year-heatmap__cell year-heatmap__cell--l${cell.level}`}
                onClick={() => onDayClick?.(cell.date!, cell.amount)}
                onMouseEnter={(e) => {
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  setTooltip({ date: cell.date!, amount: cell.amount, x: rect.left, y: rect.top });
                }}
                onMouseLeave={() => setTooltip(null)}
                aria-label={`${cell.date}: ₹${cell.amount.toLocaleString('en-IN')}`}
              />
            );
          })}
        </div>

        {/* Custom tooltip */}
        {tooltip && (
          <div
            className="year-heatmap__tooltip"
            style={
              { '--tip-x': `${tooltip.x}px`, '--tip-y': `${tooltip.y}px` } as React.CSSProperties
            }
            aria-hidden
          >
            <strong>{format(parseISO(tooltip.date), 'MMM d, yyyy')}</strong>
            <span>₹{tooltip.amount.toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Month labels — below the grid, pixel-aligned to each month's first column */}
        <div
          className="year-heatmap__month-labels"
          aria-hidden
          style={{ minWidth: `${totalWeeks * STRIDE}px` }}
        >
          {MONTH_LABELS.map((m, i) => (
            <span
              key={m}
              className="year-heatmap__month-label"
              style={{ left: `${monthColOffsets[i] * STRIDE}px` }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="year-heatmap__legend" aria-hidden>
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((l) => (
          <div key={l} className={`year-heatmap__cell year-heatmap__cell--l${l}`} />
        ))}
        <span>More</span>
      </div>

      {/* Mobile month list */}
      <div className="year-heatmap__month-list" aria-label="Monthly totals">
        {MONTH_LABELS.map((m, i) => (
          <div key={m} className="year-heatmap__month-row">
            <span className="year-heatmap__month-name">{m}</span>
            <div className="year-heatmap__month-bar">
              <div
                className="year-heatmap__month-bar-fill"
                style={{ width: maxTotal > 0 ? `${(monthTotals[i] / maxTotal) * 100}%` : '0%' }}
              />
            </div>
            <span className="year-heatmap__month-amount">
              ₹{monthTotals[i].toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
