'use client';

import { Modal } from '@/components/common/Modal';
import { SuccessState } from '@/components/features/transactions/SuccessState';
import { TypeSelector } from '@/components/features/transactions/TypeSelector';
import { ValidationSummary } from '@/components/features/transactions/ValidationSummary';
import {
  ATMWithdrawalForm,
  CouponUseForm,
  ExpenseForm,
  GiftReceivedForm,
  IncomeForm,
  InvestmentForm,
  PointsRedeemForm,
  RefundForm,
  ReimbursementForm,
  TransferForm,
} from '@/components/features/transactions/forms';
import { useBudgetImpact } from '@/components/features/transactions/hooks/useBudgetImpact';
import { useDuplicateDetect } from '@/components/features/transactions/hooks/useDuplicateDetect';
import { useTransactionForm } from '@/components/features/transactions/hooks/useTransactionForm';
import { TX_TYPE_META } from '@/constants/finance';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import { useTransactionFormStore } from '@/store/transactionFormStore';
import type { TransactionFormValues } from '@/store/transactionFormStore';
import type { CategoryOption, PaymentSourceOption, SinkingFundOption } from '@/types/finance';
import { useCallback, useEffect, useRef } from 'react';

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  paymentSources: PaymentSourceOption[];
  categories: CategoryOption[];
  categoryGroups: PickerGroup[];
  sinkingFunds: SinkingFundOption[];
  onCreateCategory?: (name: string, parentId: string | null, flowType?: string) => Promise<string>;
  editId?: string;
  prefillValues?: Partial<TransactionFormValues>;
  /** Opens straight into "Split into multiple items" mode — the home-screen "Log bill"
   *  shortcut uses this. Only meaningful on open; ignored once the modal is already up. */
  initialMultiItem?: boolean;
}

const MERCHANT_TYPES = new Set([
  'EXPENSE',
  'INCOME',
  'GIFT_RECEIVED',
  'REIMBURSEMENT',
  'REFUND',
  'COUPON_REDEMPTION',
  'POINTS_REDEMPTION',
]);

export function AddTransactionModal({
  open,
  onClose,
  paymentSources,
  categories,
  categoryGroups,
  sinkingFunds,
  onCreateCategory,
  editId,
  prefillValues,
  initialMultiItem,
}: AddTransactionModalProps) {
  const {
    values,
    errors,
    submitState,
    successData,
    isDuplicateDismissed,
    isMultiItem,
    items,
    handleTypeChange,
    handleFieldChange,
    handleItemChange,
    handleSubmit,
    handleUpdate,
    handleLogAnother,
    dismissDuplicate,
    reset,
    prefill,
  } = useTransactionForm(editId);

  const budgetImpact = useBudgetImpact({
    categoryId: values.categoryId,
    amount: values.amount,
    categories,
  });

  const duplicate = useDuplicateDetect({
    merchant: values.merchant,
    amount: values.amount,
    date: values.date,
    isDismissed: isDuplicateDismissed,
    enabled: MERCHANT_TYPES.has(values.type),
  });

  const typeMeta = TX_TYPE_META[values.type];
  const isLoading = submitState === 'loading';

  const bulkTotal = items.reduce((sum, it) => sum + (Number.parseFloat(it.amount) || 0), 0);
  const bulkNoun = values.type === 'EXPENSE' ? 'expense' : 'item';
  const submitLabel = isMultiItem
    ? isLoading
      ? 'Saving…'
      : items.length === 0
        ? 'Add an item to continue'
        : `Log ${items.length} ${bulkNoun}${items.length > 1 ? 's' : ''} · ₹${bulkTotal.toLocaleString('en-IN')}`
    : editId
      ? isLoading
        ? 'Updating…'
        : 'Update'
      : isLoading
        ? 'Saving…'
        : `Log ${typeMeta.label}`;

  // Track which editId we've already prefilled so we don't clobber user edits
  // if prefillValues re-renders (e.g. background refetch of same transaction).
  const prefillAppliedFor = useRef<string | null>(null);

  // Prefill store when opening in edit mode — also re-runs when prefillValues
  // arrives asynchronously (fetch completes after dialog mount).
  useEffect(() => {
    if (!open) return;
    if (editId && prefillValues && prefillAppliedFor.current !== editId) {
      prefill(prefillValues);
      prefillAppliedFor.current = editId;
    } else if (!editId) {
      if (prefillValues && Object.keys(prefillValues).length > 0) {
        prefill(prefillValues);
      } else {
        reset();
      }
      prefillAppliedFor.current = null;
    }
    // prefill()/reset() both hardcode isMultiItem: false, so this must run after
    // them, not before, or the "Log bill" shortcut's bulk mode gets clobbered.
    if (initialMultiItem) {
      useTransactionFormStore.getState().setMultiItem(true);
    }
  }, [open, editId, prefillValues, prefill, reset, initialMultiItem]);

  // Auto-close edit modal after successful update (no success screen for edits)
  useEffect(() => {
    if (editId && submitState === 'success') {
      onClose();
    }
  }, [editId, submitState, onClose]);

  // Default credit/debit account when options load so placeholder text is not mistaken for
  // a selection — new transactions only. Editing must never default this: the prefill
  // effect above sets the account the transaction actually used, but its store update
  // isn't visible to this effect until next render, so without the editId guard this
  // effect reads the pre-prefill empty sourceId in the same flush and immediately
  // overwrites the real account with paymentSources[0] — always "the first account",
  // never the one actually on the transaction.
  //
  // For a fresh Expense, prefer whichever account is flagged as the default expense
  // account (set from Settings > Accounts) over the alphabetical-first fallback — that
  // fallback is really just "no default has been set yet", not a meaningful choice.
  useEffect(() => {
    if (!open || editId || values.sourceId || paymentSources.length === 0) return;
    const defaultForExpense =
      values.type === 'EXPENSE'
        ? paymentSources.find((s) => s.isDefaultExpenseAccount)
        : undefined;
    handleFieldChange('sourceId', (defaultForExpense ?? paymentSources[0]).id);
  }, [open, editId, paymentSources, values.sourceId, values.type, handleFieldChange]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = useCallback(() => {
    if (editId) {
      handleUpdate();
    } else {
      handleSubmit();
    }
  }, [editId, handleUpdate, handleSubmit]);

  const sharedFormProps = {
    values,
    errors,
    onChange: handleFieldChange,
    paymentSources,
  };

  function renderTypeForm() {
    switch (values.type) {
      case 'EXPENSE':
        return (
          <ExpenseForm
            {...sharedFormProps}
            categoryGroups={categoryGroups}
            budgetImpact={budgetImpact}
            duplicate={duplicate}
            onDismissDuplicate={dismissDuplicate}
            onCreateCategory={onCreateCategory}
            onItemChange={handleItemChange}
          />
        );
      case 'INVESTMENT':
      case 'SINKING_DEPOSIT':
        return (
          <InvestmentForm
            {...sharedFormProps}
            categoryGroups={categoryGroups}
            sinkingFunds={sinkingFunds}
            onCreateCategory={onCreateCategory}
            onItemChange={handleItemChange}
          />
        );
      case 'INCOME':
        return (
          <IncomeForm
            {...sharedFormProps}
            categoryGroups={categoryGroups}
            onCreateCategory={onCreateCategory}
          />
        );
      case 'GIFT_RECEIVED':
        return <GiftReceivedForm {...sharedFormProps} />;
      case 'REIMBURSEMENT':
        return <ReimbursementForm {...sharedFormProps} />;
      case 'TRANSFER':
        return <TransferForm {...sharedFormProps} sinkingFunds={sinkingFunds} />;
      case 'ATM_WITHDRAWAL':
        return <ATMWithdrawalForm {...sharedFormProps} />;
      case 'REFUND':
        return (
          <RefundForm
            {...sharedFormProps}
            duplicate={duplicate}
            onDismissDuplicate={dismissDuplicate}
          />
        );
      case 'COUPON_REDEMPTION':
        return <CouponUseForm {...sharedFormProps} />;
      case 'POINTS_REDEMPTION':
        return <PointsRedeemForm {...sharedFormProps} />;
      default:
        return null;
    }
  }

  return (
    <Modal open={open} onClose={handleClose} size="xl" aria-label="Log transaction">
      {successData ? (
        <Modal.Body>
          <SuccessState
            data={successData}
            onLogAnother={() => {
              handleLogAnother();
            }}
            onClose={handleClose}
          />
        </Modal.Body>
      ) : (
        <>
          <Modal.Header
            title={editId ? `Edit ${typeMeta.label}` : 'Log Transaction'}
            subtitle={typeMeta.description}
          />

          <Modal.Body>
            <div className="add-tx-modal">
              <section aria-label="Transaction type">
                <TypeSelector value={values.type} onChange={handleTypeChange} />
              </section>

              <ValidationSummary errors={errors} />

              <form
                className="add-tx-modal__form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleFormSubmit();
                }}
                noValidate
              >
                {renderTypeForm()}
              </form>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleFormSubmit}
              disabled={isLoading || (isMultiItem && items.length === 0)}
              aria-busy={isLoading}
            >
              {submitLabel}
            </button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}
