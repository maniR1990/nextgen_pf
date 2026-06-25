'use client';

import { FormField } from '@/components/common/FormField';
import { CommonFormFields } from './CommonFormFields';
import type { TransactionFormValues, FormErrors } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';

interface ATMWithdrawalFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) => void;
  paymentSources: PaymentSourceOption[];
}

export function ATMWithdrawalForm({ values, errors, onChange, paymentSources }: ATMWithdrawalFormProps) {
  return (
    <div className="tx-form tx-form--atm">
      {/* ATM Location | Purpose */}
      <div className="tx-form__row tx-form__row--2">
        <FormField label="ATM Location" htmlFor="tx-atm-location">
          <input
            id="tx-atm-location"
            type="text"
            className="form-input"
            value={values.atmLocation}
            placeholder="e.g. SBI ATM, MG Road"
            onChange={(e) => onChange('atmLocation', e.target.value)}
          />
        </FormField>

        <FormField label="Purpose" htmlFor="tx-atm-purpose">
          <input
            id="tx-atm-purpose"
            type="text"
            className="form-input"
            value={values.atmPurpose}
            placeholder="e.g. Daily expenses, Travel"
            onChange={(e) => onChange('atmPurpose', e.target.value)}
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
        showMethod={false}
        showPlanned={false}
        showRecurring={false}
        showTags={false}
      />
    </div>
  );
}
