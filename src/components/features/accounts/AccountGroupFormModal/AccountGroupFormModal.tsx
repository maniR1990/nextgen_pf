'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface AccountGroupFormPayload {
  name: string;
  type: 'asset' | 'liability';
}

interface AccountGroupFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AccountGroupFormPayload) => Promise<void>;
  initialValues?: { name: string; type: 'asset' | 'liability' };
  title?: string;
}

const TITLE_ID = 'account-group-form-title';

export function AccountGroupFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
  title,
}: AccountGroupFormModalProps) {
  const isEdit = Boolean(initialValues);
  const [name, setName] = useState(initialValues?.name ?? '');
  const [type, setType] = useState<'asset' | 'liability'>(initialValues?.type ?? 'asset');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialValues?.name ?? '');
      setType(initialValues?.type ?? 'asset');
      setNameError('');
    }
  }, [open, initialValues]);

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Group name is required');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ name: trimmed, type });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} titleId={TITLE_ID}>
      <Modal.Header title={title ?? (isEdit ? 'Edit Group' : 'New Account Group')}>
        <Modal.CloseButton />
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="account-group-form">
            <Input
              label="Group Name"
              placeholder="e.g. Cash & Bank"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              error={nameError || undefined}
              disabled={saving}
              autoFocus
            />

            {!isEdit && (
              <div className="account-group-form__type-field">
                <span className="input-field__label">Type</span>
                <div className="account-group-form__type-options">
                  {(['asset', 'liability'] as const).map((t) => (
                    <label
                      key={t}
                      className={[
                        'account-group-form__type-option',
                        type === t && 'account-group-form__type-option--selected',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <input
                        type="radio"
                        name="group-type"
                        value={t}
                        checked={type === t}
                        onChange={() => setType(t)}
                        disabled={saving}
                        className="account-group-form__type-radio"
                      />
                      <span className="account-group-form__type-label">
                        {t === 'asset' ? 'Asset' : 'Liability'}
                      </span>
                      <span className="account-group-form__type-desc">
                        {t === 'asset' ? 'Bank, savings, investments' : 'Credit cards, loans'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save Changes' : 'Create Group'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
