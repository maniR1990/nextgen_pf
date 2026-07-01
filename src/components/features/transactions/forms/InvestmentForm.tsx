'use client';

import type { FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';
import { CommonFormFields } from './CommonFormFields';

interface InvestmentFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  paymentSources: PaymentSourceOption[];
}

export function InvestmentForm({ values, errors, onChange, paymentSources }: InvestmentFormProps) {
  return (
    <div className="tx-form tx-form--investment">
      <CommonFormFields
        values={values}
        errors={errors}
        onChange={onChange}
        paymentSources={paymentSources}
        showDate={false}
        showAccount={false}
        showPlanned={false}
        showRecurring={false}
        showTags
        showNotes
      />
    </div>
  );
}
