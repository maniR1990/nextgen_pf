'use client';

import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { CreateFundGroupDto, FundGroupSummary } from '@/modules/fund-groups/fund-groups.types';
import { useState } from 'react';

export interface FundGroupFormDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: FundGroupSummary;
  onSubmit: (dto: CreateFundGroupDto) => Promise<void>;
}

export function FundGroupFormDialog({
  open,
  onClose,
  initial,
  onSubmit,
}: FundGroupFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState(initial?.color ?? '#6366f1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save group');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <Modal.Header title={initial ? 'Rename Group' : 'New Fund Group'} />
      <Modal.Body>
        <form id="fund-group-form" onSubmit={handleSubmit} noValidate>
          <FormField label="Group Name" htmlFor="fg-name" required>
            <input
              id="fg-name"
              type="text"
              className="select-field__control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="e.g. Kids Education"
            />
          </FormField>
          <FormField label="Description" htmlFor="fg-desc">
            <input
              id="fg-desc"
              type="text"
              className="select-field__control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              placeholder="Optional — shown under group header"
            />
          </FormField>
          <FormField label="Color" htmlFor="fg-color">
            <div className="fund-form-drawer__color-wrap">
              <input
                id="fg-color"
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
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" form="fund-group-form" loading={loading}>
          {initial ? 'Save Changes' : 'Create Group'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
