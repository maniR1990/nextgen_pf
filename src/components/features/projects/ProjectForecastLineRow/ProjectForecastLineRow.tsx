'use client';

import { Trash2 } from 'lucide-react';

export interface ProjectForecastLineRowLine {
  id: string;
  description: string;
  forecastAmount: number;
  actualAmount?: number;
  vendorLabel?: string | null;
}

export interface ProjectForecastLineRowProps {
  line: ProjectForecastLineRowLine;
  /** Wizard mode: editable amount, remove button. Detail mode (default): read-only
   *  with the forecast-vs-actual bar and status. */
  isEditing?: boolean;
  onChangeForecast?: (id: string, amount: number) => void;
  onRemove?: (id: string) => void;
}

function statusFor(forecastAmount: number, actualAmount: number): 'on-track' | 'over' | 'unused' {
  if (actualAmount === 0) return 'unused';
  return actualAmount > forecastAmount ? 'over' : 'on-track';
}

const STATUS_LABEL: Record<ReturnType<typeof statusFor>, string> = {
  'on-track': 'On track',
  over: 'Over',
  unused: 'Unused',
};

export function ProjectForecastLineRow({
  line,
  isEditing = false,
  onChangeForecast,
  onRemove,
}: ProjectForecastLineRowProps) {
  const actualAmount = line.actualAmount ?? 0;

  if (isEditing) {
    return (
      <div className="project-forecast-line-row project-forecast-line-row--editing">
        <div className="project-forecast-line-row__label">{line.description}</div>
        <input
          type="number"
          min={0}
          step="1"
          className="select-field__control project-forecast-line-row__amount-input"
          value={line.forecastAmount || ''}
          onChange={(e) => onChangeForecast?.(line.id, Number(e.target.value) || 0)}
          aria-label={`Forecast amount for ${line.description}`}
        />
        <button
          type="button"
          className="project-forecast-line-row__remove"
          onClick={() => onRemove?.(line.id)}
          aria-label={`Remove ${line.description}`}
        >
          <Trash2 size={14} aria-hidden />
        </button>
      </div>
    );
  }

  const status = statusFor(line.forecastAmount, actualAmount);
  const fillPct = Math.min(100, (actualAmount / Math.max(line.forecastAmount, 1)) * 100);

  return (
    <div className="project-forecast-line-row">
      <div className="project-forecast-line-row__top">
        <div className="project-forecast-line-row__label">
          {line.description}
          {line.vendorLabel && (
            <span className="project-forecast-line-row__description">{line.vendorLabel}</span>
          )}
        </div>
        <span className="project-forecast-line-row__top-right">
          <span
            className={`project-forecast-line-row__status project-forecast-line-row__status--${status}`}
          >
            {STATUS_LABEL[status]}
          </span>
          {onRemove && (
            <button
              type="button"
              className="project-forecast-line-row__remove"
              onClick={() => onRemove(line.id)}
              aria-label={`Remove ${line.description}`}
            >
              <Trash2 size={14} aria-hidden />
            </button>
          )}
        </span>
      </div>
      <div className="project-forecast-line-row__bar">
        <div className="project-forecast-line-row__bar-fill" style={{ width: `${fillPct}%` }} />
      </div>
      <div className="project-forecast-line-row__amounts">
        <span>₹{actualAmount.toLocaleString('en-IN')} spent</span>
        <span>of ₹{line.forecastAmount.toLocaleString('en-IN')} forecast</span>
      </div>
    </div>
  );
}
