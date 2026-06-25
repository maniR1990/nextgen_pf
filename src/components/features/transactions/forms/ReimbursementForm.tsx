'use client';

import { FormField } from '@/components/common/FormField';
import type { FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';
import { CommonFormFields } from './CommonFormFields';

interface ReimbursementFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  paymentSources: PaymentSourceOption[];
}

export function ReimbursementForm({
  values,
  errors,
  onChange,
  paymentSources,
}: ReimbursementFormProps) {
  return (
    <div className="tx-form tx-form--reimbursement">
      {/* Merchant | Reimbursed by | Original ref */}
      <div className="tx-form__row">
        <FormField
          label="Merchant / Expense Name"
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
            placeholder="e.g. Uber, Hotel Taj"
            onChange={(e) => onChange('merchant', e.target.value)}
          />
        </FormField>

        <FormField label="Reimbursed by" htmlFor="tx-reimb-from" error={errors.reimbFrom}>
          <input
            id="tx-reimb-from"
            type="text"
            className="form-input"
            value={values.reimbFrom}
            placeholder="e.g. Employer, Client name"
            onChange={(e) => onChange('reimbFrom', e.target.value)}
          />
        </FormField>

        <FormField label="Original Transaction Reference" htmlFor="tx-orig-ref" hint="Optional">
          <input
            id="tx-orig-ref"
            type="text"
            className="form-input"
            value={values.origTxRef}
            placeholder="Transaction ID or description"
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
      />
    </div>
  );
}
