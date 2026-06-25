'use client';

import { AmountInput } from '@/components/common/AmountInput';
import { FormField } from '@/components/common/FormField';
import { SelectField } from '@/components/common/SelectField';
import { Button } from '@/components/ui/Button';
import { FUND_PURPOSES } from '@/constants/funds';
import type { FundGroupSummary } from '@/modules/fund-groups/fund-groups.types';
import type { CreateFundDto, FundSummary } from '@/modules/funds/funds.types';
import { X } from 'lucide-react';
import { useState } from 'react';

const PURPOSE_LABELS: Record<string, string> = {
  EMERGENCY: 'Emergency',
  OPS: 'Operations',
  GOAL: 'Goal',
  TAX: 'Tax',
  INSURANCE: 'Insurance',
  SINKING: 'Sinking',
  INVESTMENT: 'Investment Pool',
  WEALTH: 'Wealth',
};

const PURPOSE_OPTIONS = FUND_PURPOSES.map((p) => ({
  value: p,
  label: PURPOSE_LABELS[p] ?? p.charAt(0) + p.slice(1).toLowerCase(),
}));

const TARGET_MODE_OPTIONS = [
  { value: 'amount', label: 'Fixed Amount' },
  { value: 'months', label: 'Months of Expenses' },
];

export interface FundFormDrawerProps {
  open: boolean;
  onClose: () => void;
  initial?: FundSummary;
  initialGroupId?: string;
  groups?: FundGroupSummary[];
  onSubmit: (dto: CreateFundDto) => Promise<void>;
}

export function FundFormDrawer({
  open,
  onClose,
  initial,
  initialGroupId,
  groups = [],
  onSubmit,
}: FundFormDrawerProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [purpose, setPurpose] = useState<(typeof FUND_PURPOSES)[number]>(
    initial?.purpose ?? 'EMERGENCY',
  );
  const [groupId, setGroupId] = useState(initial?.groupId ?? initialGroupId ?? '');
  const [targetMode, setTargetMode] = useState<'amount' | 'months'>(
    initial?.targetMonths != null ? 'months' : 'amount',
  );
  const [targetAmount, setTargetAmount] = useState(String(initial?.targetAmount ?? ''));
  const [targetMonths, setTargetMonths] = useState(String(initial?.targetMonths ?? ''));
  const [color, setColor] = useState(initial?.color ?? '#4f9cf9');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const hasGroups = groups.length > 0;

  const groupOptions = groups.map((g) => ({ value: g.id, label: g.name }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    const amt = Number.parseFloat(targetAmount);
    const mos = Number.parseInt(targetMonths);
    if (targetMode === 'amount' && (!amt || amt <= 0)) {
      setError('Enter a valid target amount');
      return;
    }
    if (targetMode === 'months' && (!mos || mos <= 0)) {
      setError('Enter valid target months');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        purpose: purpose as CreateFundDto['purpose'],
        groupId: groupId || undefined,
        targetAmount: targetMode === 'amount' ? amt : undefined,
        targetMonths: targetMode === 'months' ? mos : undefined,
        color,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save fund');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fund-form-drawer__backdrop" aria-hidden onClick={onClose} />
      <aside
        className="fund-form-drawer"
        role="complementary"
        aria-label={initial ? 'Edit fund' : 'New fund'}
      >
        <div className="fund-form-drawer__header">
          <h2 className="fund-form-drawer__title">{initial ? 'Edit Fund' : 'New Fund'}</h2>
          <button
            type="button"
            className="fund-form-drawer__close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <form id="fund-form" className="fund-form-drawer__body" onSubmit={handleSubmit} noValidate>
          <FormField label="Fund Name" htmlFor="fund-name" required>
            <input
              id="fund-name"
              type="text"
              className="select-field__control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="e.g. Emergency Fund"
            />
          </FormField>

          {hasGroups ? (
            <SelectField
              label="Group"
              options={[{ value: '', label: '— No group —' }, ...groupOptions]}
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            />
          ) : (
            <SelectField
              label="Purpose"
              options={PURPOSE_OPTIONS}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as (typeof FUND_PURPOSES)[number])}
            />
          )}

          <SelectField
            label="Target Mode"
            options={TARGET_MODE_OPTIONS}
            value={targetMode}
            onChange={(e) => setTargetMode(e.target.value as 'amount' | 'months')}
          />
          {targetMode === 'amount' ? (
            <AmountInput
              value={targetAmount}
              onChange={setTargetAmount}
              label="Target Amount (₹)"
              showChips={false}
            />
          ) : (
            <FormField label="Target Months" htmlFor="fund-months">
              <input
                id="fund-months"
                type="number"
                className="select-field__control"
                value={targetMonths}
                onChange={(e) => setTargetMonths(e.target.value)}
                min="1"
                max="120"
                placeholder="e.g. 6"
              />
            </FormField>
          )}
          <FormField label="Color" htmlFor="fund-color">
            <div className="fund-form-drawer__color-wrap">
              <input
                id="fund-color"
                type="color"
                className="fund-form-drawer__color-input"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <span
                className="fund-form-drawer__color-preview"
                style={{ backgroundColor: color }}
              />
            </div>
          </FormField>
          {error && (
            <p className="form-field__error" role="alert">
              {error}
            </p>
          )}
        </form>
        <div className="fund-form-drawer__footer">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="fund-form" loading={loading}>
            {initial ? 'Save Changes' : 'Create Fund'}
          </Button>
        </div>
      </aside>
    </>
  );
}
