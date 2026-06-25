'use client';

import { FormField } from '@/components/common/FormField';
import { SelectField } from '@/components/common/SelectField';
import { PAYMENT_METHODS } from '@/constants/finance';
import { RecurringConfig } from '@/components/features/transactions/RecurringConfig';
import type { TransactionFormValues, FormErrors } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';

interface CommonFormFieldsProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) => void;
  paymentSources: PaymentSourceOption[];
  showDate?: boolean;
  showAccount?: boolean;
  showMethod?: boolean;
  showNotes?: boolean;
  showTags?: boolean;
  showPlanned?: boolean;
  showRecurring?: boolean;
}

export function CommonFormFields({
  values,
  errors,
  onChange,
  paymentSources,
  showDate = true,
  showAccount = true,
  showMethod = false,
  showNotes = true,
  showTags = true,
  showPlanned = true,
  showRecurring = true,
}: CommonFormFieldsProps) {
  const sourceOptions = (paymentSources ?? []).map((s) => ({ value: s.id, label: s.name }));

  const visibleTopFields = [showDate, showAccount, showMethod].filter(Boolean).length;

  return (
    <>
      {/* Date | Account | Method — only rendered when not hoisted to modal top */}
      {visibleTopFields > 0 && (
        <div className={`tx-form__row${visibleTopFields === 1 ? ' tx-form__row--2' : ''}`}>
          {showDate && (
            <FormField label="Date" htmlFor="tx-date" error={errors.date} required>
              <input
                id="tx-date"
                type="date"
                className={['form-input', errors.date && 'form-input--error'].filter(Boolean).join(' ')}
                value={values.date}
                onChange={(e) => onChange('date', e.target.value)}
              />
            </FormField>
          )}

          {showAccount && (
            <SelectField
              label="Account"
              id="tx-source"
              value={values.sourceId}
              options={sourceOptions}
              placeholder="Select account"
              error={errors.sourceId}
              required
              onChange={(e) => onChange('sourceId', e.target.value)}
            />
          )}

          {showMethod && (
            <SelectField
              label="Method"
              id="tx-method"
              value={values.method}
              options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
              error={errors.method}
              onChange={(e) => onChange('method', e.target.value)}
            />
          )}
        </div>
      )}

      {/* Tags + Notes — 2-col when both shown, full-width otherwise */}
      {(showTags || showNotes) && (
        <div className={showTags && showNotes ? 'tx-form__row tx-form__row--2' : undefined}>
          {showTags && (
            <FormField label="Tags" htmlFor="tx-tags" hint="Comma-separated">
              <input
                id="tx-tags"
                type="text"
                className="form-input"
                value={values.tags}
                placeholder="travel, work, emi"
                onChange={(e) => onChange('tags', e.target.value)}
              />
            </FormField>
          )}
          {showNotes && (
            <FormField label="Notes" htmlFor="tx-notes">
              <textarea
                id="tx-notes"
                className="form-input form-input--textarea"
                value={values.notes}
                rows={2}
                placeholder="Optional details..."
                onChange={(e) => onChange('notes', e.target.value)}
              />
            </FormField>
          )}
        </div>
      )}

      {showPlanned && (
        <label className="form-checkbox">
          <input
            type="checkbox"
            checked={!values.isPlanned}
            onChange={(e) => onChange('isPlanned', !e.target.checked)}
          />
          <span>Unplanned</span>
        </label>
      )}

      {showRecurring && (
        <>
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={values.isRecurring}
              onChange={(e) => onChange('isRecurring', e.target.checked)}
            />
            <span>Recurring</span>
          </label>
          {values.isRecurring && (
            <RecurringConfig values={values} onChange={onChange} errors={errors} />
          )}
        </>
      )}
    </>
  );
}
