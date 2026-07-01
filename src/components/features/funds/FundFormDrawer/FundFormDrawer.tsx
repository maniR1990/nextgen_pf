'use client';

import { AmountInput } from '@/components/common/AmountInput';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FUND_PURPOSES } from '@/constants/funds';
import { formatINR } from '@/lib/utils/format';
import type { FundGroupSummary } from '@/modules/fund-groups/fund-groups.types';
import type { CreateFundDto, FundSummary } from '@/modules/funds/funds.types';
import { useEffect, useRef } from 'react';
import { useState } from 'react';

// ─── Purpose metadata ─────────────────────────────────────────────────────────

const PURPOSE_META: Record<string, { label: string; hint: string; emoji: string }> = {
  EMERGENCY: { label: 'Emergency', hint: '3–6 months liquid safety net', emoji: '🛡️' },
  OPS: { label: 'Operations', hint: 'Monthly bills & day-to-day costs', emoji: '⚙️' },
  GOAL: { label: 'Goal', hint: 'Saving toward a specific target', emoji: '🎯' },
  TAX: { label: 'Tax', hint: 'Advance tax & year-end liability', emoji: '🧾' },
  INSURANCE: { label: 'Insurance', hint: 'Premiums & coverage reserve', emoji: '🏥' },
  SINKING: { label: 'Sinking', hint: 'Planned future large purchase', emoji: '🪣' },
  INVESTMENT: { label: 'Investment', hint: 'Dry powder for market deployment', emoji: '📈' },
  WEALTH: { label: 'Wealth', hint: 'Long-term accumulation reserve', emoji: '💎' },
};

// ─── Color palette ────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#4f9cf9',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#64748b',
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FundFormDrawerProps {
  open: boolean;
  onClose: () => void;
  initial?: FundSummary;
  initialGroupId?: string;
  groups?: FundGroupSummary[];
  onSubmit: (dto: CreateFundDto) => Promise<void>;
  onCreateGroup?: () => void;
}

// ─── Live preview card ────────────────────────────────────────────────────────

function FundPreviewCard({
  name,
  purpose,
  groupName,
  color,
  targetAmount,
}: {
  name: string;
  purpose: string;
  groupName: string;
  color: string;
  targetAmount: string;
}) {
  const amt = Number.parseFloat(targetAmount);
  const meta = PURPOSE_META[purpose];
  const hasTarget = amt > 0;
  const targetLabel = amt > 0 ? formatINR(amt) : '—';

  return (
    <div
      className="fund-form-modal__preview-card"
      style={{ '--fund-color': color } as React.CSSProperties}
    >
      <div className="fund-form-modal__preview-accent" />
      <div className="fund-form-modal__preview-body">
        <div className="fund-form-modal__preview-top">
          <div className="fund-form-modal__preview-icon">{meta?.emoji ?? '💰'}</div>
          <div className="fund-form-modal__preview-info">
            <p className="fund-form-modal__preview-name">
              {name.trim() || (
                <span className="fund-form-modal__preview-placeholder">Fund name…</span>
              )}
            </p>
            <p className="fund-form-modal__preview-meta">
              {groupName ? `${groupName} · ` : ''}
              {meta?.label ?? purpose}
            </p>
          </div>
        </div>
        <div className="fund-form-modal__preview-progress">
          <div className="fund-form-modal__preview-bar">
            <div
              className="fund-form-modal__preview-fill"
              style={{ width: '0%', backgroundColor: color }}
            />
          </div>
          <div className="fund-form-modal__preview-amounts">
            <span>₹0</span>
            <span>{hasTarget ? `/ ${targetLabel}` : 'No target set'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FundFormDrawer({
  open,
  onClose,
  initial,
  initialGroupId,
  groups = [],
  onSubmit,
  onCreateGroup,
}: FundFormDrawerProps) {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState<(typeof FUND_PURPOSES)[number]>('GOAL');
  const [groupId, setGroupId] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[5]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const customColorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setPurpose(initial?.purpose ?? 'GOAL');
    setGroupId(initial?.groupId ?? initialGroupId ?? '');
    setTargetAmount(initial?.targetAmount ? String(initial.targetAmount) : '');
    setColor(initial?.color ?? PRESET_COLORS[5]);
    setError('');
  }, [open, initial, initialGroupId]);

  const selectedGroup = groups.find((g) => g.id === groupId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Fund name is required');
      return;
    }
    const amt = Number.parseFloat(targetAmount);
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        purpose: purpose as CreateFundDto['purpose'],
        groupId: groupId || undefined,
        targetAmount: amt > 0 ? amt : undefined,
        color,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save fund');
    } finally {
      setLoading(false);
    }
  }

  const titleId = 'fund-form-modal-title';

  return (
    <Modal open={open} onClose={onClose} size="lg" titleId={titleId}>
      <Modal.Header>
        <div className="modal__title-group">
          <h2 id={titleId} className="modal__title">
            {initial ? 'Edit Fund' : 'New Fund'}
          </h2>
          <p className="modal__subtitle">
            {initial
              ? 'Update fund details and target'
              : 'Define the purpose, target and colour of your fund bucket'}
          </p>
        </div>
        <Modal.CloseButton />
      </Modal.Header>

      <Modal.Body className="fund-form-modal__body">
        <form id="fund-form" className="fund-form-modal__grid" onSubmit={handleSubmit} noValidate>
          {/* ── Left column ─────────────────────────── */}
          <div className="fund-form-modal__col">
            <FormField label="Fund Name" htmlFor="fund-name" required>
              <input
                id="fund-name"
                type="text"
                className="select-field__control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                placeholder="e.g. Emergency Buffer"
              />
            </FormField>

            {/* Purpose — visual pill grid */}
            <fieldset className="fund-form-modal__purpose-fieldset">
              <legend className="fund-form-modal__fieldset-legend">Purpose</legend>
              <div className="fund-form-modal__purpose-grid">
                {FUND_PURPOSES.map((p) => {
                  const meta = PURPOSE_META[p];
                  const active = purpose === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`fund-form-modal__purpose-pill${active ? ' fund-form-modal__purpose-pill--active' : ''}`}
                      onClick={() => setPurpose(p)}
                      aria-pressed={active}
                      title={meta?.hint}
                    >
                      <span className="fund-form-modal__purpose-emoji">{meta?.emoji}</span>
                      <span className="fund-form-modal__purpose-label">{meta?.label ?? p}</span>
                    </button>
                  );
                })}
              </div>
              {purpose && (
                <p className="fund-form-modal__purpose-hint">{PURPOSE_META[purpose]?.hint}</p>
              )}
            </fieldset>

            {/* Group */}
            {(groups.length > 0 || onCreateGroup) && (
              <FormField label="Group" htmlFor="fund-group">
                <select
                  id="fund-group"
                  className="select-field__control"
                  value={groupId}
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      onCreateGroup?.();
                      return;
                    }
                    setGroupId(e.target.value);
                  }}
                >
                  <option value="">— No group —</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                  {onCreateGroup && <option value="__new__">＋ Create new group</option>}
                </select>
              </FormField>
            )}
          </div>

          {/* ── Right column ─────────────────────────── */}
          <div className="fund-form-modal__col">
            {/* Live preview */}
            <FundPreviewCard
              name={name}
              purpose={purpose}
              groupName={selectedGroup?.name ?? ''}
              color={color}
              targetAmount={targetAmount}
            />

            {/* Target */}
            <fieldset className="fund-form-modal__purpose-fieldset">
              <legend className="fund-form-modal__fieldset-legend">Target amount</legend>
              <AmountInput
                value={targetAmount}
                onChange={setTargetAmount}
                label="Target (₹) — optional"
                showChips={false}
              />
            </fieldset>

            {/* Color */}
            <fieldset className="fund-form-modal__purpose-fieldset">
              <legend className="fund-form-modal__fieldset-legend">Colour</legend>
              <div className="fund-form-modal__swatches">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`fund-form-modal__swatch${color === c ? ' fund-form-modal__swatch--active' : ''}`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                    aria-pressed={color === c}
                    onClick={() => setColor(c)}
                  />
                ))}
                <button
                  type="button"
                  className={`fund-form-modal__swatch fund-form-modal__swatch--custom${!PRESET_COLORS.includes(color) ? ' fund-form-modal__swatch--active' : ''}`}
                  style={!PRESET_COLORS.includes(color) ? { backgroundColor: color } : undefined}
                  aria-label="Custom colour"
                  onClick={() => customColorRef.current?.click()}
                >
                  {PRESET_COLORS.includes(color) && (
                    <span aria-hidden className="fund-form-modal__swatch-plus">
                      ＋
                    </span>
                  )}
                </button>
                <input
                  ref={customColorRef}
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="fund-form-modal__hidden-color"
                  tabIndex={-1}
                  aria-hidden
                />
              </div>
            </fieldset>
          </div>
        </form>

        {error && (
          <p className="form-field__error fund-form-modal__error" role="alert">
            {error}
          </p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" form="fund-form" loading={loading}>
          {initial ? 'Save Changes' : 'Create Fund'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
