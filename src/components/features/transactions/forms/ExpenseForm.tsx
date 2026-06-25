'use client';

import { FormField } from '@/components/common/FormField';
import { SelectField } from '@/components/common/SelectField';
import { CascadingCategoryPicker } from '@/components/common/CascadingCategoryPicker';
import { BudgetImpactStrip } from '@/components/features/transactions/BudgetImpactStrip';
import { DuplicateDetect } from '@/components/features/transactions/DuplicateDetect';
import { TAX_SECTIONS } from '@/constants/finance';
import type { TransactionFormValues, FormErrors } from '@/store/transactionFormStore';
import type { PaymentSourceOption, BudgetImpact, DuplicateMatch } from '@/types/finance';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';

interface ExpenseFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) => void;
  paymentSources: PaymentSourceOption[];
  categoryGroups: PickerGroup[];
  budgetImpact: BudgetImpact | null;
  duplicate: DuplicateMatch | null;
  onDismissDuplicate: () => void;
  onCreateCategory?: (name: string, parentId: string | null) => Promise<string>;
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
  const showConditionalRow = values.isTaxDed || values.isReimbursable;

  return (
    <div className="tx-form tx-form--expense">

      {/* Merchant */}
      <FormField label="Merchant / Description" htmlFor="tx-merchant" error={errors.merchant} required>
        <input
          id="tx-merchant"
          type="text"
          className={['form-input', errors.merchant && 'form-input--error'].filter(Boolean).join(' ')}
          value={values.merchant}
          placeholder="e.g. BigBasket, Swiggy..."
          onChange={(e) => onChange('merchant', e.target.value)}
        />
      </FormField>

      {/* Row 2: Category (full width) */}
      <CascadingCategoryPicker
        label="Category"
        groups={categoryGroups}
        value={values.categoryId || null}
        onChange={(id) => onChange('categoryId', id ?? '')}
        error={errors.categoryId}
        onCreateL2={onCreateCategory ? (name, parentId) => onCreateCategory(name, parentId) : undefined}
      />

      {duplicate && <DuplicateDetect duplicate={duplicate} onDismiss={onDismissDuplicate} />}
      <BudgetImpactStrip impact={budgetImpact} />

      {/* Tax Deductible */}
      <div className="tx-form__toggle-group">
        <div className="form-field__label-row">
          <span className="form-field__label">TAX DEDUCTIBLE?</span>
          <span className="form-field__badge">NEW</span>
        </div>
        <div className="tx-form__toggle-chips">
          <button
            type="button"
            className={['tx-form__toggle-chip', !values.isTaxDed ? 'tx-form__toggle-chip--active' : ''].filter(Boolean).join(' ')}
            onClick={() => onChange('isTaxDed', false)}
          >
            No
          </button>
          <button
            type="button"
            className={['tx-form__toggle-chip', values.isTaxDed ? 'tx-form__toggle-chip--active' : ''].filter(Boolean).join(' ')}
            onClick={() => onChange('isTaxDed', true)}
          >
            Yes
          </button>
        </div>
      </div>

      {/* Reimbursable | Tags | Notes */}
      <div className="tx-form__row">
        <div className="tx-form__toggle-group">
          <div className="form-field__label-row">
            <span className="form-field__label">REIMBURSABLE?</span>
            <span className="form-field__badge">NEW</span>
          </div>
          <div className="tx-form__toggle-chips">
            <button
              type="button"
              className={['tx-form__toggle-chip', !values.isReimbursable ? 'tx-form__toggle-chip--active' : ''].filter(Boolean).join(' ')}
              onClick={() => onChange('isReimbursable', false)}
            >
              No
            </button>
            <button
              type="button"
              className={['tx-form__toggle-chip', values.isReimbursable ? 'tx-form__toggle-chip--active' : ''].filter(Boolean).join(' ')}
              onClick={() => onChange('isReimbursable', true)}
            >
              Yes
            </button>
          </div>
        </div>

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

      {/* Row 5 (conditional): Tax Section | Reimbursement Date */}
      {showConditionalRow && (
        <div className="tx-form__row tx-form__row--2">
          {values.isTaxDed && (
            <SelectField
              label="Tax Section"
              id="tx-tax-section"
              value={values.taxSection}
              options={TAX_SECTIONS.map((t) => ({ value: t.value, label: t.label }))}
              placeholder="Pick section"
              error={errors.taxSection}
              onChange={(e) => onChange('taxSection', e.target.value)}
            />
          )}
          {values.isReimbursable && (
            <FormField label="Expected reimbursement by" htmlFor="tx-reimb-date">
              <input
                id="tx-reimb-date"
                type="date"
                className="form-input"
                value={values.reimbDate}
                min={values.date}
                onChange={(e) => onChange('reimbDate', e.target.value)}
              />
            </FormField>
          )}
        </div>
      )}

    </div>
  );
}
