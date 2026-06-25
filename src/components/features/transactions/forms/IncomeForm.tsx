'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Info } from 'lucide-react';
import { FormField } from '@/components/common/FormField';
import { CascadingCategoryPicker } from '@/components/common/CascadingCategoryPicker';
import { getIncomePeriodData, formatAmountShort } from '@/lib/utils/incomePeriod';
import type { TransactionFormValues, FormErrors } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';

interface IncomeFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) => void;
  paymentSources: PaymentSourceOption[];
  categoryGroups: PickerGroup[];
  onCreateCategory?: (name: string, parentId: string | null) => Promise<string>;
}

export function IncomeForm({ values, errors, onChange, paymentSources, categoryGroups, onCreateCategory }: IncomeFormProps) {
  const periodData = useMemo(
    () => (values.date ? getIncomePeriodData(values.date) : null),
    [values.date],
  );

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || !periodData) return;
    didInit.current = true;
    onChange('budgetPeriodYear', periodData.defaultYear);
    onChange('budgetPeriodMonth', periodData.defaultMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedSuggestion = periodData?.suggestions.find(
    (s) => s.year === values.budgetPeriodYear && s.month === values.budgetPeriodMonth,
  ) ?? periodData?.suggestions[0];

  const isNextMonthSelected = selectedSuggestion
    ? selectedSuggestion.year !== periodData?.suggestions[1]?.year ||
      selectedSuggestion.month !== periodData?.suggestions[1]?.month
    : false;

  const amountShort = formatAmountShort(values.amount);
  const amountDisplay = values.amount && parseFloat(values.amount) > 0
    ? `₹${Number(values.amount).toLocaleString('en-IN')}`
    : null;

  return (
    <div className="tx-form tx-form--income">

      {/* Description */}
      <FormField label="Description" htmlFor="tx-merchant" error={errors.merchant} required>
        <input
          id="tx-merchant"
          type="text"
          className={['form-input', errors.merchant && 'form-input--error'].filter(Boolean).join(' ')}
          value={values.merchant}
          placeholder="Salary — ABC Technologies"
          onChange={(e) => onChange('merchant', e.target.value)}
        />
      </FormField>

      {/* Budget Period selector */}
      {periodData && (
        <div className="income-period">
          <p className="income-period__heading">
            BUDGET PERIOD —{' '}
            <strong>Which month does this salary fund?</strong>
          </p>

          <div className="income-period__cards">
            {periodData.suggestions.map((s) => {
              const isSelected =
                values.budgetPeriodYear === s.year && values.budgetPeriodMonth === s.month;
              return (
                <label
                  key={`${s.year}-${s.month}`}
                  className={[
                    'income-period__card',
                    isSelected && 'income-period__card--selected',
                  ].filter(Boolean).join(' ')}
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
                  {isNextMonthSelected
                    ? "Living on last month's income."
                    : 'Same-month income.'}
                </strong>{' '}
                {amountDisplay
                  ? `This ${amountDisplay} will appear as "Available in ${selectedSuggestion.label}." All ${selectedSuggestion.label.split(' ')[0]} transactions will draw from it. Your ${selectedSuggestion.label.split(' ')[0]} surplus/deficit will be accurately tracked.`
                  : `Income will appear as "Available in ${selectedSuggestion.label}."`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Row 2: Category (full width) */}
      <CascadingCategoryPicker
        label="Category"
        groups={categoryGroups}
        value={values.categoryId || null}
        onChange={(id) => onChange('categoryId', id ?? '')}
        error={errors.categoryId}
        onCreateL2={onCreateCategory ? (name, parentId) => onCreateCategory(name, parentId) : undefined}
      />

      {/* TDS (optional) — 1/3 width */}
      <div className="tx-form__row">
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
      </div>
    </div>
  );
}
