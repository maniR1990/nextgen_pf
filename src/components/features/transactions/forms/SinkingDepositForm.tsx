'use client';

import { CollapsibleSection } from '@/components/common/CollapsibleSection';
import { SelectField } from '@/components/common/SelectField';
import type { FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption, SinkingFundOption } from '@/types/finance';
import { CommonFormFields } from './CommonFormFields';

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

      <CommonFormFields
        values={values}
        errors={errors}
        onChange={onChange}
        paymentSources={paymentSources}
        showAmount
        showMethod={false}
        showTags={false}
        showNotes={false}
        showRecurring={false}
      />

      <CollapsibleSection label="More details — method, recurring, notes">
        <CommonFormFields
          values={values}
          errors={errors}
          onChange={onChange}
          paymentSources={paymentSources}
          showDate={false}
          showAccount={false}
          showTags={false}
        />
      </CollapsibleSection>
    </div>
  );
}
