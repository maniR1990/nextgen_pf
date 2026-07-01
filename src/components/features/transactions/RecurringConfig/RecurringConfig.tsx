'use client';

import { FormField } from '@/components/common/FormField';
import { SelectField } from '@/components/common/SelectField';
import { RECURRENCE_FREQUENCIES } from '@/constants/finance';
import type { TransactionFormValues } from '@/store/transactionFormStore';

interface RecurringConfigProps {
  values: TransactionFormValues;
  onChange: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  errors: Partial<Record<keyof TransactionFormValues, string>>;
}

function nextOccurrences(frequency: string, startDate: string, every: number, count = 3): string[] {
  const d = new Date(startDate);
  if (Number.isNaN(d.getTime())) return [];

  const dates: string[] = [];
  let current = new Date(d);

  for (let i = 0; i < count; i++) {
    if (i > 0) {
      switch (frequency) {
        case 'MONTHLY':
          current = new Date(current.setMonth(current.getMonth() + every));
          break;
        case 'TWICE_MONTHLY':
          current = new Date(current.setDate(current.getDate() + 15));
          break;
        case 'QUARTERLY':
          current = new Date(current.setMonth(current.getMonth() + 3 * every));
          break;
        case 'HALF_YEARLY':
          current = new Date(current.setMonth(current.getMonth() + 6));
          break;
        case 'ANNUAL':
          current = new Date(current.setFullYear(current.getFullYear() + every));
          break;
        case 'EVERY_2_MONTHS':
          current = new Date(current.setMonth(current.getMonth() + 2 * every));
          break;
        default:
          current = new Date(current.setMonth(current.getMonth() + every));
      }
    }

    dates.push(
      current.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    );
  }

  return dates;
}

export function RecurringConfig({ values, onChange, errors }: RecurringConfigProps) {
  const { recFrequency, recEvery, recEndCondition, recCount, recEndDate, date } = values;
  const preview = nextOccurrences(recFrequency, date, Number.parseInt(recEvery) || 1);

  return (
    <div className="recurring-config">
      <div className="recurring-config__row">
        <SelectField
          label="Frequency"
          value={recFrequency}
          options={RECURRENCE_FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))}
          onChange={(e) =>
            onChange('recFrequency', e.target.value as TransactionFormValues['recFrequency'])
          }
          error={errors.recFrequency}
        />

        <FormField label="Every" htmlFor="recEvery">
          <input
            id="recEvery"
            type="number"
            min={1}
            max={12}
            className="form-input"
            value={recEvery}
            onChange={(e) => onChange('recEvery', e.target.value)}
          />
        </FormField>
      </div>

      <div className="recurring-config__end-row">
        <label className="recurring-config__end-label">Ends</label>
        <div className="recurring-config__end-options">
          {(['forever', 'count', 'date'] as const).map((opt) => (
            <label key={opt} className="recurring-config__radio-label">
              <input
                type="radio"
                name="recEndCondition"
                value={opt}
                checked={recEndCondition === opt}
                onChange={() => onChange('recEndCondition', opt)}
              />
              {opt === 'forever' ? 'Never' : opt === 'count' ? 'After N times' : 'On date'}
            </label>
          ))}
        </div>
      </div>

      {recEndCondition === 'count' && (
        <FormField label="Occurrences" htmlFor="recCount" error={errors.recCount}>
          <input
            id="recCount"
            type="number"
            min={2}
            max={120}
            className="form-input"
            value={recCount}
            onChange={(e) => onChange('recCount', e.target.value)}
            placeholder="e.g. 12"
          />
        </FormField>
      )}

      {recEndCondition === 'date' && (
        <FormField label="End Date" htmlFor="recEndDate" error={errors.recEndDate}>
          <input
            id="recEndDate"
            type="date"
            className="form-input"
            value={recEndDate}
            min={date}
            onChange={(e) => onChange('recEndDate', e.target.value)}
          />
        </FormField>
      )}

      {preview.length > 0 && (
        <div className="recurring-config__preview">
          <span className="recurring-config__preview-label">Next occurrences</span>
          <ul className="recurring-config__preview-list">
            {preview.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
