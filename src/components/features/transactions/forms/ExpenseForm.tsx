'use client';

import { CollapsibleCategoryPicker } from '@/components/common/CollapsibleCategoryPicker';
import { CollapsibleSection } from '@/components/common/CollapsibleSection';
import { FormField } from '@/components/common/FormField';
import { BudgetImpactStrip } from '@/components/features/transactions/BudgetImpactStrip';
import { DuplicateDetect } from '@/components/features/transactions/DuplicateDetect';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import type { FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import type { BudgetImpact, DuplicateMatch, PaymentSourceOption } from '@/types/finance';
import { CommonFormFields } from './CommonFormFields';

interface ExpenseFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  paymentSources: PaymentSourceOption[];
  categoryGroups: PickerGroup[];
  budgetImpact: BudgetImpact | null;
  duplicate: DuplicateMatch | null;
  onDismissDuplicate: () => void;
  onCreateCategory?: (name: string, parentId: string | null, flowType?: string) => Promise<string>;
}

export function ExpenseForm({
  values,
  errors,
  onChange,
  paymentSources,
  categoryGroups,
  budgetImpact,
  duplicate,
  onDismissDuplicate,
  onCreateCategory,
}: ExpenseFormProps) {
  return (
    <div className="tx-form tx-form--expense">
      {/* Merchant leads — it's what you actually remember ("BigBasket run"),
          not the category bucket it rolls up into. */}
      <FormField
        label="Merchant / Description"
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
          placeholder="e.g. BigBasket, Swiggy..."
          onChange={(e) => onChange('merchant', e.target.value)}
        />
      </FormField>

      <CollapsibleCategoryPicker
        label="Category"
        required
        groups={categoryGroups}
        priorityGroupType="EXPENSE"
        value={values.categoryId || null}
        onChange={(id) => onChange('categoryId', id ?? '')}
        error={errors.categoryId}
        onCreateL1={
          onCreateCategory ? (name) => onCreateCategory(name, null, 'EXPENSE') : undefined
        }
        onCreateL2={
          onCreateCategory ? (name, parentId) => onCreateCategory(name, parentId) : undefined
        }
        onCreateL3={
          onCreateCategory ? (name, parentId) => onCreateCategory(name, parentId) : undefined
        }
      />

      {duplicate && <DuplicateDetect duplicate={duplicate} onDismiss={onDismissDuplicate} />}
      <BudgetImpactStrip impact={budgetImpact} />

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

      <CollapsibleSection label="More details — method, tags, notes">
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
