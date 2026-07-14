'use client';

import { AmountInput } from '@/components/common/AmountInput';
import { FormField } from '@/components/common/FormField';
import { MiniDateStrip } from '@/components/common/MiniDateStrip';
import { SelectField } from '@/components/common/SelectField';
import { RecurringConfig } from '@/components/features/transactions/RecurringConfig';
import { PAYMENT_METHODS, TX_TYPE_META } from '@/constants/finance';
import type { FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';

interface CommonFormFieldsProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  paymentSources: PaymentSourceOption[];
  showAmount?: boolean;
  showDate?: boolean;
  showAccount?: boolean;
  /** Defaults to TX_TYPE_META[values.type].hasMethod — override only for a genuine exception. */
  showMethod?: boolean;
  showNotes?: boolean;
  showTags?: boolean;
  /** Defaults to TX_TYPE_META[values.type].hasPlanned. */
  showPlanned?: boolean;
  /** Defaults to TX_TYPE_META[values.type].hasRecurring. */
  showRecurring?: boolean;
}

export function CommonFormFields({
  values,
  errors,
  onChange,
  paymentSources,
  showAmount = false,
  showDate = true,
  showAccount = true,
  showMethod,
  showNotes = true,
  showTags = true,
  showPlanned,
  showRecurring,
}: CommonFormFieldsProps) {
  const sourceOptions = (paymentSources ?? []).map((s) => ({ value: s.id, label: s.name }));
  const typeMeta = TX_TYPE_META[values.type];
  const resolvedShowMethod = showMethod ?? typeMeta.hasMethod;
  const resolvedShowPlanned = showPlanned ?? typeMeta.hasPlanned;
  const resolvedShowRecurring = showRecurring ?? typeMeta.hasRecurring;

  const visibleKeyFields = [showAccount, resolvedShowMethod].filter(Boolean).length;

  return (
    <>
      {showAmount && (
        <AmountInput
          value={values.amount}
          onChange={(v) => onChange('amount', v)}
          error={errors.amount}
          required
        />
      )}

      {/* Own row — a chip row doesn't belong squeezed into a select-field-width column. */}
      {showDate && (
        <MiniDateStrip
          value={values.date}
          onChange={(v) => onChange('date', v)}
          error={errors.date}
          required
        />
      )}

      {/* Account | Method — grid only when both share the row; a lone field
          renders in a plain wrapper so it takes the full row width instead of
          sitting in one half of a 2-column grid it has no partner for. */}
      {visibleKeyFields > 0 && (
        <div className={visibleKeyFields === 2 ? 'tx-form__row tx-form__row--2' : undefined}>
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

          {resolvedShowMethod && (
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

      {resolvedShowPlanned && (
        <label className="form-checkbox">
          <input
            type="checkbox"
            checked={!values.isPlanned}
            onChange={(e) => onChange('isPlanned', !e.target.checked)}
          />
          <span>Unplanned</span>
        </label>
      )}

      {resolvedShowRecurring && (
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
