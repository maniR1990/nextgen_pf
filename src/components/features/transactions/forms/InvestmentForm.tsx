'use client';

import { CascadingCategoryPicker } from '@/components/common/CascadingCategoryPicker';
import { CollapsibleSection } from '@/components/common/CollapsibleSection';
import { FormField } from '@/components/common/FormField';
import { SelectField } from '@/components/common/SelectField';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import type { BulkItemDraft, FormErrors, TransactionFormValues } from '@/store/transactionFormStore';
import { useTransactionFormStore } from '@/store/transactionFormStore';
import type { PaymentSourceOption, SinkingFundOption } from '@/types/finance';
import { PiggyBank, TrendingUp } from 'lucide-react';
import { CommonFormFields } from './CommonFormFields';
import { MultiItemExpenseForm } from './MultiItemExpenseForm';

interface InvestmentFormProps {
  values: TransactionFormValues;
  errors: FormErrors;
  onChange: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  paymentSources: PaymentSourceOption[];
  categoryGroups: PickerGroup[];
  sinkingFunds: SinkingFundOption[];
  onCreateCategory?: (name: string, parentId: string | null, flowType?: string) => Promise<string>;
  /** Auto-fills a bulk item's amount from its category's remaining budget on pick. */
  onItemChange?: (id: string, patch: Partial<Omit<BulkItemDraft, 'id'>>) => void;
}

type DestinationKind = 'INVESTMENT' | 'SINKING_DEPOSIT';

const DESTINATIONS: { type: DestinationKind; label: string; icon: typeof TrendingUp }[] = [
  { type: 'INVESTMENT', label: 'Investment account', icon: TrendingUp },
  { type: 'SINKING_DEPOSIT', label: 'Sinking fund / goal', icon: PiggyBank },
];

// Investment and Sinking Deposit are the same economic action (money set aside, not
// spent) that used to be forced into two separate top-level types with no way back —
// logging one and meaning the other meant deleting the row and starting over. Both now
// live under one Investment entry; this toggle is the only place that choice is made,
// and it's re-openable on edit exactly like everything else in this form. Both
// destinations share the same required "which account does this land in" field — a
// Sinking Fund link (Saved/Target/Monthly) is optional progress-tracking on top of
// that, not a substitute for it, so an empty funds list never blocks logging.
export function InvestmentForm({
  values,
  errors,
  onChange,
  paymentSources,
  categoryGroups,
  sinkingFunds,
  onCreateCategory,
  onItemChange,
}: InvestmentFormProps) {
  const isSinking = values.type === 'SINKING_DEPOSIT';
  const isMultiItem = useTransactionFormStore((s) => s.isMultiItem);
  const setMultiItem = useTransactionFormStore((s) => s.setMultiItem);

  // Switching destination only clears fundId — Sinking-only, meaningless once the
  // money is going to an Investment account instead. Everything else carries over
  // untouched: amount, date, account, method, tags, notes, toAccountId (shared
  // destination-account field for both), and categoryId (shared now too — see below).
  function handleDestinationChange(type: DestinationKind) {
    if (type === values.type) return;
    onChange('type', type);
    if (type === 'INVESTMENT') {
      onChange('fundId', '');
      // Split-into-items is Sinking-only (funding several budgeted bills from one
      // contribution) — Investment mode has no toggle to turn it back off, so switching
      // destination away from Sinking must clear it here.
      setMultiItem(false);
    }
  }

  // Same account list Transfer uses, minus whichever account is already the source —
  // investing into the same account you're funding it from isn't a valid movement.
  const destinationOptions = (paymentSources ?? [])
    .filter((s) => s.id !== values.sourceId)
    .map((s) => ({ value: s.id, label: s.name }));

  const fundOptions = sinkingFunds.map((f) => ({
    value: f.id,
    label: `${f.label} (${((f.saved / f.target) * 100).toFixed(0)}% of ₹${f.target.toLocaleString('en-IN')})`,
  }));
  const selectedFund = sinkingFunds.find((f) => f.id === values.fundId);

  return (
    <div className="tx-form tx-form--investment">
      <FormField label="Goes into">
        <div className="tx-form__destination-toggle" role="radiogroup" aria-label="Goes into">
          {DESTINATIONS.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={values.type === type}
              className={[
                'tx-form__destination-btn',
                values.type === type && 'tx-form__destination-btn--active',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleDestinationChange(type)}
            >
              <Icon size={15} aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </FormField>

      {/* Sinking-only: one contribution funding several already-budgeted bills at once
          (EB Electricity, Internet, insurance premiums, ...) instead of logging each as
          its own deposit. Each item keeps its own real category, so it updates that
          category's actual spend on the Budget page exactly like a normal Expense would
          — this reuses the same MultiItemExpenseForm Bulk Expense already has, just
          fed through the Sinking destination instead. */}
      {isSinking && (
        <div className="tx-form__multi-toggle">
          <div className="tx-form__multi-toggle-text">
            <span className="tx-form__multi-toggle-label">Split into items</span>
            <span className="tx-form__multi-toggle-hint">
              Fund several budgeted bills from one contribution
            </span>
          </div>
          <label className="tx-form__switch">
            <input
              type="checkbox"
              checked={isMultiItem}
              onChange={(e) => setMultiItem(e.target.checked)}
              aria-label="Split into items"
            />
            <span className="tx-form__switch-track">
              <span className="tx-form__switch-thumb" />
            </span>
          </label>
        </div>
      )}

      {isMultiItem && isSinking ? (
        <MultiItemExpenseForm
          categoryGroups={categoryGroups}
          onCreateCategory={onCreateCategory}
          onUpdateItem={onItemChange}
        />
      ) : (
        // Category — shown for both destinations. The category tree already carries
        // goal-shaped entries under Investment (Daughter's Future, Marriage / Life
        // Milestone Fund, Sukanya Samriddhi Yojana, Job Loss / Income Gap Fund, ...) —
        // exactly the vocabulary a sinking deposit needs, and it's the only way a
        // sinking deposit rolls up into the Budget page's category tree or the Reports
        // category filter at all, since the linked Fund (optional, below) covers
        // per-goal progress tracking but not that cross-cutting analysis. Optional here,
        // same as it already was for Investment — never required by the schema.
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
      )}

      <CommonFormFields
        values={values}
        errors={errors}
        onChange={onChange}
        paymentSources={paymentSources}
        showAmount={!(isMultiItem && isSinking)}
        showMethod={false}
        showTags={false}
        showNotes={false}
        showPlanned={false}
        showRecurring={false}
      />

      {isSinking ? (
        // Required — a sinking deposit always lands in a real account (a savings
        // account, a separate goal wallet), same as Transfer's To Account. Its balance
        // is credited, same shape as Investment's transfer-with-destination.
        <SelectField
          label="Deposit Into"
          id="tx-invest-to-account"
          value={values.toAccountId}
          options={destinationOptions}
          placeholder="Select account"
          error={errors.toAccountId}
          required
          onChange={(e) => onChange('toAccountId', e.target.value)}
        />
      ) : (
        // Optional — an investment doesn't have to land in a tracked account (e.g. an
        // employer ESPP with no ledger entry here). When set, the destination account's
        // balance is credited too instead of the money just disappearing from the source.
        <SelectField
          label="Invested Into"
          id="tx-invest-to-account"
          value={values.toAccountId}
          options={destinationOptions}
          placeholder="Select investment account (optional)"
          error={errors.toAccountId}
          onChange={(e) => onChange('toAccountId', e.target.value)}
        />
      )}

      {isSinking && (
        // Purely enrichment — progress-tracking against a named goal, layered on top
        // of a deposit that already happened via "Deposit Into" above. Never blocks
        // logging, so having zero funds set up yet isn't a dead end.
        <div className="tx-form__fund-track">
          {sinkingFunds.length > 0 ? (
            <>
              <SelectField
                label="Track toward a goal (optional)"
                id="tx-sf"
                value={values.fundId}
                options={fundOptions}
                placeholder="No goal tracking"
                error={errors.fundId}
                onChange={(e) => onChange('fundId', e.target.value)}
              />
              {selectedFund && (
                <div className="tx-form__fund-info">
                  <span>Saved: ₹{selectedFund.saved.toLocaleString('en-IN')}</span>
                  <span>Target: ₹{selectedFund.target.toLocaleString('en-IN')}</span>
                  <span>Monthly goal: ₹{selectedFund.monthly.toLocaleString('en-IN')}</span>
                </div>
              )}
            </>
          ) : (
            <p className="tx-form__fund-empty">
              No sinking funds yet —{' '}
              <a href="/dashboard/sinking-funds" target="_blank" rel="noopener noreferrer">
                create one
              </a>{' '}
              to track progress. Logging this deposit doesn&apos;t require it.
            </p>
          )}
        </div>
      )}

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
