'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useState } from 'react';
import type { BudgetLineFormValues } from './schemas';

export interface BudgetLineFormModalProps {
  open: boolean;
  title: string;
  initial?: Partial<BudgetLineFormValues>;
  onClose: () => void;
  onSubmit: (values: BudgetLineFormValues) => Promise<void>;
}

export function BudgetLineFormModal({
  open,
  title,
  initial,
  onClose,
  onSubmit,
}: BudgetLineFormModalProps) {
  const [values, setValues] = useState<BudgetLineFormValues>({
    title: initial?.title ?? '',
    plannedMinor: initial?.plannedMinor ?? 0,
    spentMinor: initial?.spentMinor ?? 0,
    note: initial?.note ?? '',
    typeLabel: initial?.typeLabel ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(values);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const titleId = 'budget-line-form-title';

  return (
    <Modal open={open} onClose={onClose} titleId={titleId}>
      <Modal.Header>
        <h2 id={titleId} className="modal__title">
          {title}
        </h2>
        <Modal.CloseButton />
      </Modal.Header>
      <Modal.Body>
        <form className="budget-ledger__form" id="budget-line-form" onSubmit={handleSubmit}>
          <Input
            label="Title"
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            required
          />
          <Input
            label="Planned (minor units)"
            type="number"
            value={values.plannedMinor}
            onChange={(e) =>
              setValues((v) => ({ ...v, plannedMinor: Number(e.target.value) || 0 }))
            }
            min={0}
          />
          <Input
            label="Spent (minor units)"
            type="number"
            value={values.spentMinor}
            onChange={(e) =>
              setValues((v) => ({ ...v, spentMinor: Number(e.target.value) || 0 }))
            }
            min={0}
          />
          <Input
            label="Type label"
            value={values.typeLabel ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, typeLabel: e.target.value }))}
          />
          <Input
            label="Notes"
            value={values.note ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
          />
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="budget-line-form" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
