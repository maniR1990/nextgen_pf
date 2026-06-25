'use client';

import { FormField } from '@/components/common/FormField';
import type { FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';
import { useEffect } from 'react';

interface PointsRedeemFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  paymentSources: PaymentSourceOption[];
}

export function PointsRedeemForm({
  values,
  errors,
  onChange,
}: Omit<PointsRedeemFormProps, 'paymentSources'> & { paymentSources?: PaymentSourceOption[] }) {
  const ptsNum = Number.parseFloat(values.ptsSpent);
  const rateNum = Number.parseFloat(values.ptsRate);
  const autoAmount =
    !isNaN(ptsNum) && !isNaN(rateNum) && ptsNum > 0 && rateNum > 0
      ? (ptsNum * rateNum).toFixed(2)
      : null;

  useEffect(() => {
    if (autoAmount) onChange('amount', autoAmount);
  }, [autoAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="tx-form tx-form--points">
      {/* Merchant | Points Spent | Rate */}
      <div className="tx-form__row">
        <FormField
          label="Merchant / Programme"
          htmlFor="tx-merchant"
          error={errors.merchant}
          required
        >
          <input
            id="tx-merchant"
            type="text"
            className={['form-input', errors.merchant && 'form-input--error']
              .filter(Boolean)
              .join(' ')}
            value={values.merchant}
            placeholder="e.g. HDFC SmartBuy, Amazon Pay"
            onChange={(e) => onChange('merchant', e.target.value)}
          />
        </FormField>

        <FormField label="Points Spent" htmlFor="tx-pts-spent" error={errors.ptsSpent} required>
          <input
            id="tx-pts-spent"
            type="number"
            step="1"
            min="1"
            className={['form-input', errors.ptsSpent && 'form-input--error']
              .filter(Boolean)
              .join(' ')}
            value={values.ptsSpent}
            placeholder="e.g. 5000"
            onChange={(e) => onChange('ptsSpent', e.target.value)}
          />
        </FormField>

        <FormField
          label="Rate (₹/point)"
          htmlFor="tx-pts-rate"
          error={errors.ptsRate}
          hint="e.g. 0.25 = 25 paise per point"
        >
          <input
            id="tx-pts-rate"
            type="number"
            step="0.01"
            min="0.01"
            className={['form-input', errors.ptsRate && 'form-input--error']
              .filter(Boolean)
              .join(' ')}
            value={values.ptsRate}
            placeholder="0.25"
            onChange={(e) => onChange('ptsRate', e.target.value)}
          />
        </FormField>
      </div>

      {autoAmount && (
        <div className="tx-form__auto-amount">
          <span className="tx-form__auto-label">Equivalent value</span>
          <span className="tx-form__auto-value">
            ₹{Number.parseFloat(autoAmount).toLocaleString('en-IN')}
          </span>
        </div>
      )}

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
    </div>
  );
}
