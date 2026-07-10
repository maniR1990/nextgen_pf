'use client';

import { CascadingCategoryPicker } from '@/components/common/CascadingCategoryPicker';
import { CollapsibleSection } from '@/components/common/CollapsibleSection';
import { SelectField } from '@/components/common/SelectField';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
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
  categoryGroups: PickerGroup[];
  onCreateCategory?: (name: string, parentId: string | null, flowType?: string) => Promise<string>;
}

export function InvestmentForm({
  values,
  errors,
  onChange,
  paymentSources,
  categoryGroups,
  onCreateCategory,
}: InvestmentFormProps) {
  // Same account list Transfer uses, minus whichever account is already the source —
  // investing into the same account you're funding it from isn't a valid movement.
  const destinationOptions = (paymentSources ?? [])
    .filter((s) => s.id !== values.sourceId)
    .map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="tx-form tx-form--investment">
      {/* Category first — mirrors Expense: helps this roll up into the right Budget
          line (e.g. "PPF", "ELSS") even if the user isn't sure of the exact fund yet. */}
      <CascadingCategoryPicker
        label="Category"
        groups={categoryGroups}
        priorityGroupType="INVESTMENT"
        value={values.categoryId || null}
        onChange={(id) => onChange('categoryId', id ?? '')}
        error={errors.categoryId}
        onCreateL1={
          onCreateCategory ? (name) => onCreateCategory(name, null, 'INVESTMENT') : undefined
        }
        onCreateL2={
          onCreateCategory ? (name, parentId) => onCreateCategory(name, parentId) : undefined
        }
        onCreateL3={
          onCreateCategory ? (name, parentId) => onCreateCategory(name, parentId) : undefined
        }
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
        showPlanned={false}
        showRecurring={false}
      />

      <CollapsibleSection label="More details — invested into, method, tags, notes">
        {/* Optional — an investment doesn't have to land in a tracked account (e.g. an
            employer ESPP with no ledger entry here), so this isn't required like
            Transfer's To Account is. When set, the destination account's balance is
            credited too instead of the money just disappearing from the source. */}
        <SelectField
          label="Invested Into"
          id="tx-invest-to-account"
          value={values.toAccountId}
          options={destinationOptions}
          placeholder="Select investment account (optional)"
          error={errors.toAccountId}
          onChange={(e) => onChange('toAccountId', e.target.value)}
        />

        <CommonFormFields
          values={values}
          errors={errors}
          onChange={onChange}
          paymentSources={paymentSources}
          showDate={false}
          showAccount={false}
        />
      </CollapsibleSection>
    </div>
  );
}
