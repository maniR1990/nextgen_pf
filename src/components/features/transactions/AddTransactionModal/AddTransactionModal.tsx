'use client';

import { AmountInput } from '@/components/common/AmountInput';
import { FormField } from '@/components/common/FormField';
import { Modal } from '@/components/common/Modal';
import { SelectField } from '@/components/common/SelectField';
import { RecurringConfig } from '@/components/features/transactions/RecurringConfig';
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
  SinkingDepositForm,
  TransferForm,
} from '@/components/features/transactions/forms';
import { useBudgetImpact } from '@/components/features/transactions/hooks/useBudgetImpact';
import { useDuplicateDetect } from '@/components/features/transactions/hooks/useDuplicateDetect';
import { useTransactionForm } from '@/components/features/transactions/hooks/useTransactionForm';
import { TX_TYPE_META } from '@/constants/finance';
import { PAYMENT_METHODS } from '@/constants/finance';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
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
}: AddTransactionModalProps) {
  const {
    values,
    errors,
    submitState,
    successData,
    isDuplicateDismissed,
    handleTypeChange,
    handleFieldChange,
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

  const sourceOptions = (paymentSources ?? []).map((s) => ({ value: s.id, label: s.name }));
  const methodOptions = PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }));

  const TYPES_WITH_METHOD = new Set([
    'EXPENSE',
    'INCOME',
    'INVESTMENT',
    'SINKING_DEPOSIT',
    'GIFT_RECEIVED',
    'REIMBURSEMENT',
    'TRANSFER',
    'REFUND',
    'COUPON_REDEMPTION',
  ]);
  const showMethod = TYPES_WITH_METHOD.has(values.type);
  const showPlanned = values.type === 'EXPENSE';
  const showRecurring = ['EXPENSE', 'INVESTMENT', 'SINKING_DEPOSIT'].includes(values.type);

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
  }, [open, editId, prefillValues, prefill, reset]);

  // Auto-close edit modal after successful update (no success screen for edits)
  useEffect(() => {
    if (editId && submitState === 'success') {
      onClose();
    }
  }, [editId, submitState, onClose]);

  // Default credit/debit account when options load so placeholder text is not mistaken for a selection.
  useEffect(() => {
    if (!open || values.sourceId || paymentSources.length === 0) return;
    handleFieldChange('sourceId', paymentSources[0].id);
  }, [open, paymentSources, values.sourceId, handleFieldChange]);

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
          />
        );
      case 'INVESTMENT':
        return (
          <InvestmentForm
            {...sharedFormProps}
            categoryGroups={categoryGroups}
            onCreateCategory={onCreateCategory}
          />
        );
      case 'SINKING_DEPOSIT':
        return <SinkingDepositForm {...sharedFormProps} sinkingFunds={sinkingFunds} />;
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
        return <TransferForm {...sharedFormProps} />;
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
              <div className="add-tx-modal__top-grid">
                <section aria-label="Transaction type">
                  <TypeSelector value={values.type} onChange={handleTypeChange} />
                </section>

                <div className="add-tx-modal__key-fields">
                  <AmountInput
                    value={values.amount}
                    onChange={(v) => handleFieldChange('amount', v)}
                    error={errors.amount}
                    required
                  />
                  <FormField label="Date" htmlFor="tx-date-top" error={errors.date} required>
                    <input
                      id="tx-date-top"
                      type="date"
                      className={['form-input', errors.date && 'form-input--error']
                        .filter(Boolean)
                        .join(' ')}
                      value={values.date}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                    />
                  </FormField>

                  <div className={showMethod ? 'add-tx-modal__key-pair' : 'add-tx-modal__key-full'}>
                    <SelectField
                      label="Account"
                      id="tx-account-top"
                      value={values.sourceId}
                      options={sourceOptions}
                      placeholder={
                        sourceOptions.length === 0 ? 'Add accounts in Settings' : 'Select account'
                      }
                      error={errors.sourceId}
                      required
                      onChange={(e) => handleFieldChange('sourceId', e.target.value)}
                    />
                    {showMethod && (
                      <SelectField
                        label="Method"
                        id="tx-method-top"
                        value={values.method}
                        options={methodOptions}
                        onChange={(e) => handleFieldChange('method', e.target.value)}
                      />
                    )}
                  </div>

                  {(showPlanned || showRecurring) && (
                    <div className="add-tx-modal__key-checks">
                      {showPlanned && (
                        <label className="form-checkbox">
                          <input
                            type="checkbox"
                            checked={!values.isPlanned}
                            onChange={(e) => handleFieldChange('isPlanned', !e.target.checked)}
                          />
                          <span>Unplanned</span>
                        </label>
                      )}
                      {showRecurring && (
                        <label className="form-checkbox">
                          <input
                            type="checkbox"
                            checked={values.isRecurring}
                            onChange={(e) => handleFieldChange('isRecurring', e.target.checked)}
                          />
                          <span>Recurring</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {values.isRecurring && showRecurring && (
                <RecurringConfig values={values} onChange={handleFieldChange} errors={errors} />
              )}

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
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {editId
                ? isLoading
                  ? 'Updating…'
                  : 'Update'
                : isLoading
                  ? 'Saving…'
                  : `Log ${typeMeta.label}`}
            </button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}
