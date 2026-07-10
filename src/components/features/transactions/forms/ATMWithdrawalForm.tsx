'use client';

import { CollapsibleSection } from '@/components/common/CollapsibleSection';
import { FormField } from '@/components/common/FormField';
import { SelectField } from '@/components/common/SelectField';
import type { FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';
import { useEffect, useRef } from 'react';
import { CommonFormFields } from './CommonFormFields';

interface ATMWithdrawalFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  paymentSources: PaymentSourceOption[];
}

export function ATMWithdrawalForm({
  values,
  errors,
  onChange,
  paymentSources,
}: ATMWithdrawalFormProps) {
  // Same movement shape as Transfer — money leaves the source (bank) account and must
  // land somewhere, not vanish. Unlike Investment, a destination is always required:
  // there's no such thing as an ATM withdrawal with nowhere for the cash to go.
  const destinationOptions = (paymentSources ?? [])
    .filter((s) => s.id !== values.sourceId)
    .map((s) => ({ value: s.id, label: s.name }));

  // Seed the destination with the user's cash wallet the first time this form is used —
  // an ATM withdrawal almost always lands in the same one or two "Cash" accounts, so
  // don't make the user pick it every single time. Still fully editable.
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || values.toAccountId) return;
    didInit.current = true;
    const cashAccount = paymentSources.find(
      (s) => s.type.startsWith('CASH') && s.id !== values.sourceId,
    );
    if (cashAccount) onChange('toAccountId', cashAccount.id);
  }, [paymentSources, values.sourceId, values.toAccountId, onChange]);

  return (
    <div className="tx-form tx-form--atm">
      <SelectField
        label="To Account"
        id="tx-atm-to-account"
        value={values.toAccountId}
        options={destinationOptions}
        placeholder="Select cash / wallet account"
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
        showTags={false}
        showNotes={false}
      />

      <CollapsibleSection label="More details — ATM location, purpose, notes">
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
          showTags={false}
        />
      </CollapsibleSection>
    </div>
  );
}
