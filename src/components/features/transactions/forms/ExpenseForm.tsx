'use client';

import { CascadingCategoryPicker } from '@/components/common/CascadingCategoryPicker';
import { FormField } from '@/components/common/FormField';
import { BudgetImpactStrip } from '@/components/features/transactions/BudgetImpactStrip';
import { DuplicateDetect } from '@/components/features/transactions/DuplicateDetect';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import type { FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import type { BudgetImpact, DuplicateMatch, PaymentSourceOption } from '@/types/finance';

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
      {/* Category first — user may know the item but not the category */}
      <CascadingCategoryPicker
        label="Category"
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

      {/* Merchant */}
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

      {duplicate && <DuplicateDetect duplicate={duplicate} onDismiss={onDismissDuplicate} />}
      <BudgetImpactStrip impact={budgetImpact} />

      {/* Tags | Notes */}
      <div className="tx-form__row">
        <FormField label="Tags" htmlFor="tx-tags" hint="Comma-separated">
          <input
            id="tx-tags"
            type="text"
            className="form-input"
            value={values.tags}
            placeholder="groceries, annual..."
            onChange={(e) => onChange('tags', e.target.value)}
          />
        </FormField>
        <FormField label="Notes" htmlFor="tx-notes">
          <input
            id="tx-notes"
            type="text"
            className="form-input"
            value={values.notes}
            placeholder="Optional notes..."
            onChange={(e) => onChange('notes', e.target.value)}
          />
        </FormField>
      </div>
    </div>
  );
}
