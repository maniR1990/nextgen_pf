'use client';

import { FormField } from '@/components/common/FormField';
import { CommonFormFields } from './CommonFormFields';
import type { TransactionFormValues, FormErrors } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';

interface GiftReceivedFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) => void;
  paymentSources: PaymentSourceOption[];
}

export function GiftReceivedForm({ values, errors, onChange, paymentSources }: GiftReceivedFormProps) {
  return (
    <div className="tx-form tx-form--gift">
      {/* From | Occasion | Merchant */}
      <div className="tx-form__row">
        <FormField label="From (Person / Organisation)" htmlFor="tx-gift-from" error={errors.giftFrom}>
          <input
            id="tx-gift-from"
            type="text"
            className="form-input"
            value={values.giftFrom}
            placeholder="e.g. Grandma, Company name"
            onChange={(e) => onChange('giftFrom', e.target.value)}
          />
        </FormField>

        <FormField label="Occasion" htmlFor="tx-occasion">
          <input
            id="tx-occasion"
            type="text"
            className="form-input"
            value={values.occasion}
            placeholder="e.g. Birthday, Diwali"
            onChange={(e) => onChange('occasion', e.target.value)}
          />
        </FormField>

        <FormField label="Merchant / Platform" htmlFor="tx-merchant" error={errors.merchant}>
          <input
            id="tx-merchant"
            type="text"
            className="form-input"
            value={values.merchant}
            placeholder="e.g. Amazon voucher (optional)"
            onChange={(e) => onChange('merchant', e.target.value)}
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
