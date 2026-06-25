'use client';

import { useState } from 'react';
import type { AccountType } from '@prisma/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/common/FormField';
import { SelectField } from '@/components/common/SelectField';
import { AmountInput } from '@/components/common/AmountInput';
import type { AccountGroupWithAccounts } from '@/modules/accounts/accounts.types';
import type { CreateAccountDto } from '@/modules/accounts/accounts.types';
import { ACCOUNT_TYPE_META, isLiabilityAccountType, type AccountTypeMeta } from '@/constants/accounts';
import { AccountTypeGrid } from '../AccountTypeGrid';
import { InstitutionSelector } from '../InstitutionSelector';

export interface AccountFormWizardProps {
  open: boolean;
  onClose: () => void;
  accountGroups: AccountGroupWithAccounts[];
  onSubmit: (dto: CreateAccountDto) => Promise<void>;
}

interface WizardState {
  type: AccountType | null;
  institutionName: string;
  groupId: string;
  name: string;
  balance: string;
  openingBalance: string;
  accountNumber: string;
  ifscCode: string;
  creditLimit: string;
  interestRate: string;
  emi: string;
  remainingEmis: string;
  note: string;
}

const STEPS = ['Select Type', 'Institution', 'Details & Balance', 'Fund Links', 'Review & Save'];
const TITLE_ID = 'account-wizard-title';

function initialState(): WizardState {
  return {
    type: null,
    institutionName: '',
    groupId: '',
    name: '',
    balance: '0',
    openingBalance: '0',
    accountNumber: '',
    ifscCode: '',
    creditLimit: '',
    interestRate: '',
    emi: '',
    remainingEmis: '',
    note: '',
  };
}

export function AccountFormWizard({
  open,
  onClose,
  accountGroups,
  onSubmit,
}: AccountFormWizardProps) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch }));

  const groupOptions = accountGroups.map((g) => ({ value: g.id, label: g.name }));
  const isLiability = state.type ? isLiabilityAccountType(state.type) : false;
  const typeMeta: AccountTypeMeta | null = state.type
    ? (ACCOUNT_TYPE_META[state.type] as AccountTypeMeta)
    : null;

  function validate(): string {
    if (step === 1 && !state.type) return 'Please select an account type';
    if (step === 3 && !state.name.trim()) return 'Account name is required';
    if (step === 3 && !state.groupId) return 'Please select an account group';
    return '';
  }

  function handleNext() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => Math.min(s + 1, 5));
  }

  function handleBack() {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    if (!state.type || !state.groupId || !state.name.trim()) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const dto: CreateAccountDto = {
        name: state.name.trim(),
        type: state.type,
        groupId: state.groupId,
        balance: parseFloat(state.balance) || 0,
        openingBalance: parseFloat(state.openingBalance) || 0,
        accountNumber: state.accountNumber || undefined,
        ifscCode: state.ifscCode || undefined,
        creditLimit: state.creditLimit ? parseFloat(state.creditLimit) : undefined,
        interestRate: state.interestRate ? parseFloat(state.interestRate) : undefined,
        emi: state.emi ? parseFloat(state.emi) : undefined,
        remainingEmis: state.remainingEmis ? parseInt(state.remainingEmis) : undefined,
        note: state.note || undefined,
      };
      await onSubmit(dto);
      setState(initialState());
      setStep(1);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setState(initialState());
    setStep(1);
    setError('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} titleId={TITLE_ID} size="lg">
      <Modal.Header>
        <div className="account-wizard__header">
          <h2 id={TITLE_ID} className="modal__title">{STEPS[step - 1]}</h2>
          <span className="account-wizard__step-label">Step {step} of {STEPS.length}</span>
        </div>

        {/* Step progress bar */}
        <nav className="account-wizard__steps" aria-label="Wizard steps">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={[
                'account-wizard__step',
                i + 1 < step && 'account-wizard__step--done',
                i + 1 === step && 'account-wizard__step--active',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={i + 1 === step ? 'step' : undefined}
            >
              <span className="account-wizard__step-num">{i + 1}</span>
              <span className="account-wizard__step-name">{label}</span>
            </div>
          ))}
        </nav>
        <Modal.CloseButton />
      </Modal.Header>

      <Modal.Body>
        {error && <p className="form-field__error" role="alert">{error}</p>}

        {/* Step 1: Select Type */}
        {step === 1 && (
          <AccountTypeGrid
            selected={state.type ?? undefined}
            onSelect={(t) => set({ type: t })}
          />
        )}

        {/* Step 2: Institution */}
        {step === 2 && (
          <div className="account-wizard__step-body">
            <InstitutionSelector
              value={state.institutionName}
              onChange={(v) => set({ institutionName: v })}
            />
            {typeMeta && (
              <div className="account-wizard__type-hint">
                <strong>{typeMeta.name}</strong>
                {typeMeta.wealthRole && <p>{typeMeta.wealthRole}</p>}
                {typeMeta.strategy && <p className="account-wizard__strategy">{typeMeta.strategy}</p>}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Details & Balance */}
        {step === 3 && (
          <div className="account-wizard__step-body">
            <FormField label="Account Name" htmlFor="acc-name" required>
              <input
                id="acc-name"
                type="text"
                className="select-field__control"
                value={state.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder={typeMeta?.name ?? 'e.g. HDFC Salary'}
                maxLength={120}
              />
            </FormField>
            <SelectField
              label="Account Group"
              options={groupOptions}
              placeholder="Select group"
              value={state.groupId}
              onChange={(e) => set({ groupId: e.target.value })}
              required
            />
            <AmountInput
              value={state.balance}
              onChange={(v) => set({ balance: v })}
              label="Current Balance (₹)"
              showChips={false}
            />
            {!isLiability && (
              <AmountInput
                value={state.openingBalance}
                onChange={(v) => set({ openingBalance: v })}
                label="Opening Balance (₹)"
                showChips={false}
              />
            )}
            {state.type && ['BANK_SALARY', 'BANK_SAVINGS', 'BANK_CURRENT', 'BANK_NRE'].includes(state.type) && (
              <>
                <FormField label="Account Number" htmlFor="acc-number">
                  <input
                    id="acc-number"
                    type="text"
                    className="select-field__control"
                    value={state.accountNumber}
                    onChange={(e) => set({ accountNumber: e.target.value })}
                    maxLength={20}
                    placeholder="Last 4 digits or full number"
                  />
                </FormField>
                <FormField label="IFSC Code" htmlFor="acc-ifsc">
                  <input
                    id="acc-ifsc"
                    type="text"
                    className="select-field__control"
                    value={state.ifscCode}
                    onChange={(e) => set({ ifscCode: e.target.value.toUpperCase() })}
                    maxLength={11}
                    placeholder="e.g. HDFC0001234"
                  />
                </FormField>
              </>
            )}
            {isLiability && state.type === 'CREDIT_CARD' && (
              <>
                <AmountInput
                  value={state.creditLimit}
                  onChange={(v) => set({ creditLimit: v })}
                  label="Credit Limit (₹)"
                  showChips={false}
                />
                <FormField label="Interest Rate (% p.a.)" htmlFor="acc-rate">
                  <input
                    id="acc-rate"
                    type="number"
                    className="select-field__control"
                    value={state.interestRate}
                    onChange={(e) => set({ interestRate: e.target.value })}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="e.g. 36"
                  />
                </FormField>
              </>
            )}
            {isLiability && ['LOAN_HOME', 'LOAN_CAR', 'LOAN_PERSONAL', 'LOAN_EDUCATION'].includes(state.type ?? '') && (
              <>
                <AmountInput
                  value={state.emi}
                  onChange={(v) => set({ emi: v })}
                  label="EMI Amount (₹)"
                  showChips={false}
                />
                <FormField label="Remaining EMIs" htmlFor="acc-emis">
                  <input
                    id="acc-emis"
                    type="number"
                    className="select-field__control"
                    value={state.remainingEmis}
                    onChange={(e) => set({ remainingEmis: e.target.value })}
                    min="0"
                    placeholder="e.g. 180"
                  />
                </FormField>
              </>
            )}
            <FormField label="Note (optional)" htmlFor="acc-note">
              <input
                id="acc-note"
                type="text"
                className="select-field__control"
                value={state.note}
                onChange={(e) => set({ note: e.target.value })}
                maxLength={500}
                placeholder="Any notes about this account"
              />
            </FormField>
          </div>
        )}

        {/* Step 4: Fund Links (informational — full allocation requires account to exist) */}
        {step === 4 && (
          <div className="account-wizard__step-body account-wizard__step-body--info">
            <p className="account-wizard__info-text">
              Fund links can be configured after the account is created.
              You'll be able to allocate percentages or fixed amounts from this account
              to your fund buckets (Emergency, Ops, Goals, etc.).
            </p>
          </div>
        )}

        {/* Step 5: Review & Save */}
        {step === 5 && typeMeta && (
          <div className="account-wizard__review">
            <dl className="account-wizard__review-list">
              <div className="account-wizard__review-row">
                <dt>Type</dt>
                <dd>{typeMeta.name}</dd>
              </div>
              <div className="account-wizard__review-row">
                <dt>Institution</dt>
                <dd>{state.institutionName || '—'}</dd>
              </div>
              <div className="account-wizard__review-row">
                <dt>Name</dt>
                <dd>{state.name || '—'}</dd>
              </div>
              <div className="account-wizard__review-row">
                <dt>Group</dt>
                <dd>{accountGroups.find((g) => g.id === state.groupId)?.name ?? '—'}</dd>
              </div>
              <div className="account-wizard__review-row">
                <dt>Current Balance</dt>
                <dd>₹{parseFloat(state.balance || '0').toLocaleString('en-IN')}</dd>
              </div>
              {state.accountNumber && (
                <div className="account-wizard__review-row">
                  <dt>Account Number</dt>
                  <dd>••••{state.accountNumber.slice(-4)}</dd>
                </div>
              )}
              {state.creditLimit && (
                <div className="account-wizard__review-row">
                  <dt>Credit Limit</dt>
                  <dd>₹{parseFloat(state.creditLimit).toLocaleString('en-IN')}</dd>
                </div>
              )}
              {state.emi && (
                <div className="account-wizard__review-row">
                  <dt>EMI</dt>
                  <dd>₹{parseFloat(state.emi).toLocaleString('en-IN')}</dd>
                </div>
              )}
              {state.note && (
                <div className="account-wizard__review-row">
                  <dt>Note</dt>
                  <dd>{state.note}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <div className="account-wizard__nav-btns">
          {step > 1 && (
            <Button variant="ghost" onClick={handleBack} disabled={loading}>
              Back
            </Button>
          )}
          {step < STEPS.length ? (
            <Button onClick={handleNext} disabled={step === 1 && !state.type}>
              Next
            </Button>
          ) : (
            <Button loading={loading} onClick={handleSubmit}>
              Create Account
            </Button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
}
