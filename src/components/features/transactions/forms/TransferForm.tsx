'use client';

import { CollapsibleSection } from '@/components/common/CollapsibleSection';
import { FormField } from '@/components/common/FormField';
import { SelectField } from '@/components/common/SelectField';
import type { FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';
import { CommonFormFields } from './CommonFormFields';

interface TransferFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  paymentSources: PaymentSourceOption[];
}

export function TransferForm({ values, errors, onChange, paymentSources }: TransferFormProps) {
  const accountOptions = (paymentSources ?? [])
    .filter((s) => s.id !== values.sourceId)
    .map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="tx-form tx-form--transfer">
      {/* Destination leads — it's the one real decision for a transfer. */}
      <SelectField
        label="To Account"
        id="tx-to-account"
        value={values.toAccountId}
        options={accountOptions}
        placeholder="Select destination account"
        error={errors.toAccountId}
        required
        onChange={(e) => onChange('toAccountId', e.target.value)}
      />

      <CommonFormFields
        values={values}
        errors={errors}
        onChange={onChange}
        paymentSources={paymentSources}
        showAmount
        showMethod={false}
        showTags={false}
        showNotes={false}
      />

      <CollapsibleSection label="More details — purpose, fee, method, notes">
        <div className="tx-form__row tx-form__row--2">
          <FormField label="Purpose" htmlFor="tx-tx-purpose">
            <input
              id="tx-tx-purpose"
              type="text"
              className="form-input"
              value={values.txPurpose}
              placeholder="e.g. Emergency fund top-up"
              onChange={(e) => onChange('txPurpose', e.target.value)}
            />
          </FormField>

          <FormField label="Transfer Fee (₹)" htmlFor="tx-fee" hint="Leave blank if free">
            <input
              id="tx-fee"
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={values.txFee}
              placeholder="0.00"
              onChange={(e) => onChange('txFee', e.target.value)}
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
          showTags={false}
        />
      </CollapsibleSection>
    </div>
  );
}
