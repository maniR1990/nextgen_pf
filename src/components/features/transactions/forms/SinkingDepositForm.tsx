'use client';

import { FormField } from '@/components/common/FormField';
import { SelectField } from '@/components/common/SelectField';
import type { FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption, SinkingFundOption } from '@/types/finance';

interface SinkingDepositFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  paymentSources: PaymentSourceOption[];
  sinkingFunds: SinkingFundOption[];
}

export function SinkingDepositForm({
  values,
  errors,
  onChange,
  paymentSources,
  sinkingFunds,
}: SinkingDepositFormProps) {
  const fundOptions = sinkingFunds.map((f) => ({
    value: f.id,
    label: `${f.label} (${((f.saved / f.target) * 100).toFixed(0)}% of ₹${f.target.toLocaleString('en-IN')})`,
  }));

  const selectedFund = sinkingFunds.find((f) => f.id === values.sfId);

  return (
    <div className="tx-form tx-form--sinking">
      {/* Sinking Fund — full width (long label with progress %) */}
      <SelectField
        label="Sinking Fund"
        id="tx-sf"
        value={values.sfId}
        options={fundOptions}
        placeholder="Select fund"
        error={errors.sfId}
        required
        onChange={(e) => onChange('sfId', e.target.value)}
      />

      {selectedFund && (
        <div className="tx-form__fund-info">
          <span>Saved: ₹{selectedFund.saved.toLocaleString('en-IN')}</span>
          <span>Target: ₹{selectedFund.target.toLocaleString('en-IN')}</span>
          <span>Monthly goal: ₹{selectedFund.monthly.toLocaleString('en-IN')}</span>
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
