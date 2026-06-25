'use client';

import { FormField } from '@/components/common/FormField';
import { SelectField } from '@/components/common/SelectField';
import { DuplicateDetect } from '@/components/features/transactions/DuplicateDetect';
import { REFUND_REASONS } from '@/constants/finance';
import type { FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import type { DuplicateMatch, PaymentSourceOption } from '@/types/finance';
import { CommonFormFields } from './CommonFormFields';

interface RefundFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  paymentSources: PaymentSourceOption[];
  duplicate: DuplicateMatch | null;
  onDismissDuplicate: () => void;
}

export function RefundForm({
  values,
  errors,
  onChange,
  paymentSources,
  duplicate,
  onDismissDuplicate,
}: RefundFormProps) {
  return (
    <div className="tx-form tx-form--refund">
      {duplicate && <DuplicateDetect duplicate={duplicate} onDismiss={onDismissDuplicate} />}

      {/* Merchant | Reason | Original ref */}
      <div className="tx-form__row">
        <FormField label="Merchant" htmlFor="tx-merchant" error={errors.merchant} required>
          <input
            id="tx-merchant"
            type="text"
            className={['form-input', errors.merchant && 'form-input--error']
              .filter(Boolean)
              .join(' ')}
            value={values.merchant}
            placeholder="e.g. Flipkart, Swiggy"
            onChange={(e) => onChange('merchant', e.target.value)}
          />
        </FormField>

        <SelectField
          label="Reason"
          id="tx-refund-reason"
          value={values.refundReason}
          options={REFUND_REASONS.map((r) => ({ value: r.value, label: r.label }))}
          placeholder="Select reason"
          error={errors.refundReason}
          onChange={(e) => onChange('refundReason', e.target.value)}
        />

        <FormField label="Original Transaction Reference" htmlFor="tx-orig-ref" hint="Optional">
          <input
            id="tx-orig-ref"
            type="text"
            className="form-input"
            value={values.origTxRef}
            placeholder="Transaction ID"
            onChange={(e) => onChange('origTxRef', e.target.value)}
          />
        </FormField>
      </div>

      <CommonFormFields
        values={values}
        errors={errors}
        onChange={onChange}
        paymentSources={paymentSources}
        showDate={false}
        showAccount={false}
        showPlanned={false}
        showRecurring={false}
        showTags={false}
      />
    </div>
  );
}
