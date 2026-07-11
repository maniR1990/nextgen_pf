'use client';

import { CascadingCategoryPicker } from '@/components/common/CascadingCategoryPicker';
import { CollapsibleSection } from '@/components/common/CollapsibleSection';
import { FormField } from '@/components/common/FormField';
import { formatAmountShort, getIncomePeriodData } from '@/lib/utils/incomePeriod';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import type { FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';
import { Info } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { CommonFormFields } from './CommonFormFields';

interface IncomeFormProps {
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

export function IncomeForm({
  values,
  errors,
  onChange,
  paymentSources,
  categoryGroups,
  onCreateCategory,
}: IncomeFormProps) {
  const periodData = useMemo(
    () => (values.date ? getIncomePeriodData(values.date) : null),
    [values.date],
  );

  const didInit = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once on mount to seed defaults; periodData captured via ref to avoid stale closure
  useEffect(() => {
    if (didInit.current || !periodData) return;
    didInit.current = true;
    onChange('budgetPeriodYear', periodData.defaultYear);
    onChange('budgetPeriodMonth', periodData.defaultMonth);
  }, []);

  const selectedSuggestion =
    periodData?.suggestions.find(
      (s) => s.year === values.budgetPeriodYear && s.month === values.budgetPeriodMonth,
    ) ?? periodData?.suggestions[0];

  const isNextMonthSelected = selectedSuggestion
    ? selectedSuggestion.year !== periodData?.suggestions[1]?.year ||
      selectedSuggestion.month !== periodData?.suggestions[1]?.month
    : false;

  const amountShort = formatAmountShort(values.amount);
  const amountDisplay =
    values.amount && Number.parseFloat(values.amount) > 0
      ? `₹${Number(values.amount).toLocaleString('en-IN')}`
      : null;

  return (
    <div className="tx-form tx-form--income">
      {/* Category */}
      <CascadingCategoryPicker
        label="Category"
        required
        groups={categoryGroups}
        priorityGroupType="INCOME"
        value={values.categoryId || null}
        onChange={(id) => onChange('categoryId', id ?? '')}
        error={errors.categoryId}
        onCreateL1={onCreateCategory ? (name) => onCreateCategory(name, null, 'INCOME') : undefined}
        onCreateL2={
          onCreateCategory ? (name, parentId) => onCreateCategory(name, parentId) : undefined
        }
        onCreateL3={
          onCreateCategory ? (name, parentId) => onCreateCategory(name, parentId) : undefined
        }
      />

      {/* Description */}
      <FormField label="Description" htmlFor="tx-merchant" error={errors.merchant} required>
        <input
          id="tx-merchant"
          type="text"
          className={['form-input', errors.merchant && 'form-input--error']
            .filter(Boolean)
            .join(' ')}
          value={values.merchant}
          placeholder="Salary — ABC Technologies"
          onChange={(e) => onChange('merchant', e.target.value)}
        />
      </FormField>

      {/* Budget Period selector */}
      {periodData && (
        <div className="income-period">
          <p className="income-period__heading">
            BUDGET PERIOD — <strong>Which month does this salary fund?</strong>
          </p>

          <div className="income-period__cards">
            {periodData.suggestions.map((s) => {
              const isSelected =
                values.budgetPeriodYear === s.year && values.budgetPeriodMonth === s.month;
              return (
                <label
                  key={`${s.year}-${s.month}`}
                  className={['income-period__card', isSelected && 'income-period__card--selected']
                    .filter(Boolean)
                    .join(' ')}
                >
                  <input
                    type="radio"
                    name="budget-period"
                    checked={isSelected}
                    onChange={() => {
                      onChange('budgetPeriodYear', s.year);
                      onChange('budgetPeriodMonth', s.month);
                    }}
                  />
                  <div className="income-period__card-body">
                    <div className="income-period__card-header">
                      <span className="income-period__card-title">{s.label}</span>
                      <div className="income-period__card-meta">
                        {s.recommended && (
                          <span className="income-period__card-badge">Recommended</span>
                        )}
                        {isSelected && amountShort && (
                          <span className="income-period__card-amount">{amountShort}</span>
                        )}
                      </div>
                    </div>
                    <p className="income-period__card-reason">{s.reason}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {selectedSuggestion && (
            <div className="income-period__info">
              <Info size={15} className="income-period__info-icon" aria-hidden />
              <p className="income-period__info-text">
                <strong className="income-period__info-strong">
                  {isNextMonthSelected ? "Living on last month's income." : 'Same-month income.'}
                </strong>{' '}
                {amountDisplay
                  ? `This ${amountDisplay} will appear as "Available in ${selectedSuggestion.label}." All ${selectedSuggestion.label.split(' ')[0]} transactions will draw from it. Your ${selectedSuggestion.label.split(' ')[0]} surplus/deficit will be accurately tracked.`
                  : `Income will appear as "Available in ${selectedSuggestion.label}."`}
              </p>
            </div>
          )}
        </div>
      )}

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

      <CollapsibleSection label="More details — method, TDS, tags, notes">
        <FormField
          label="TDS Deducted (₹)"
          htmlFor="tx-tds"
          hint="Leave blank if no TDS was deducted"
        >
          <input
            id="tx-tds"
            type="number"
            step="0.01"
            min="0"
            className="form-input"
            value={values.tds}
            placeholder="0.00"
            onChange={(e) => onChange('tds', e.target.value)}
          />
        </FormField>

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
