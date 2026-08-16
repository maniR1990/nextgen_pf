'use client';

import { FormField } from '@/components/common/FormField';
import { useFormOptions } from '@/components/common/TransactionDialog/hooks/useFormOptions';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { ForecastLineBody, ProjectBody, ProjectSummary } from '@/hooks/useProjects';
import { useEffect, useState } from 'react';
import { ProjectForecastLineRow } from '../ProjectForecastLineRow';

interface DraftForecastLine extends ForecastLineBody {
  id: string;
}

export interface ProjectFormWizardProps {
  open: boolean;
  onClose: () => void;
  initial?: ProjectSummary;
  onSubmit: (dto: ProjectBody) => Promise<void>;
}

type FundingChoice = { kind: 'account' | 'fund'; id: string } | null;

function encodeFunding(choice: FundingChoice) {
  return choice ? `${choice.kind}:${choice.id}` : '';
}

function decodeFunding(value: string): FundingChoice {
  if (!value) return null;
  const [kind, id] = value.split(':');
  return kind === 'account' || kind === 'fund' ? { kind, id } : null;
}

function toDateInputValue(iso: string | null | undefined) {
  return iso ? iso.slice(0, 10) : '';
}

/**
 * Create/edit a Project. Funding is a single existing account or sinking fund —
 * deliberately not a split-allocation editor (see plan doc "cut #2"): promote to
 * a real multi-source model only if a genuine split need shows up.
 */
export function ProjectFormWizard({ open, onClose, initial, onSubmit }: ProjectFormWizardProps) {
  const { sources, sinkingFunds } = useFormOptions();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetCompletionDate, setTargetCompletionDate] = useState('');
  const [funding, setFunding] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial forecast lines only apply on create — see projects.schema.ts for why
  // editing lines on an existing project goes through the Budget forecast tab
  // instead of this bulk field.
  const [draftLines, setDraftLines] = useState<DraftForecastLine[]>([]);
  const [draftDescription, setDraftDescription] = useState('');
  const [draftAmount, setDraftAmount] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setDescription(initial?.description ?? '');
    setStartDate(toDateInputValue(initial?.startDate));
    setTargetCompletionDate(toDateInputValue(initial?.targetCompletionDate));
    setFunding(
      encodeFunding(
        initial?.fundingAccountId
          ? { kind: 'account', id: initial.fundingAccountId }
          : initial?.fundingFundId
            ? { kind: 'fund', id: initial.fundingFundId }
            : null,
      ),
    );
    setDraftLines([]);
    setDraftDescription('');
    setDraftAmount('');
    setError('');
  }, [open, initial]);

  function addDraftLine() {
    const amount = Number(draftAmount);
    if (!draftDescription.trim() || !amount || amount <= 0) return;
    setDraftLines((lines) => [
      ...lines,
      {
        id: crypto.randomUUID(),
        description: draftDescription.trim(),
        forecastAmount: amount,
      },
    ]);
    setDraftDescription('');
    setDraftAmount('');
  }

  function removeDraftLine(id: string) {
    setDraftLines((lines) => lines.filter((l) => l.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (startDate && targetCompletionDate && targetCompletionDate < startDate) {
      setError('Target completion date must be on or after the start date');
      return;
    }

    const fundingChoice = decodeFunding(funding);
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        targetCompletionDate: targetCompletionDate
          ? new Date(targetCompletionDate).toISOString()
          : undefined,
        fundingAccountId: fundingChoice?.kind === 'account' ? fundingChoice.id : undefined,
        fundingFundId: fundingChoice?.kind === 'fund' ? fundingChoice.id : undefined,
        ...(!initial &&
          draftLines.length > 0 && {
            forecastLines: draftLines.map(({ description, forecastAmount }) => ({
              description,
              forecastAmount,
            })),
          }),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setLoading(false);
    }
  }

  const titleId = 'project-form-modal-title';

  return (
    <Modal open={open} onClose={onClose} size="lg" titleId={titleId}>
      <Modal.Header>
        <div className="modal__title-group">
          <h2 id={titleId} className="modal__title">
            {initial ? 'Edit project' : 'New project'}
          </h2>
          <p className="modal__subtitle">
            {initial
              ? 'Update the project basics and funding source'
              : 'A large one-off spend, tracked separately from your monthly budget'}
          </p>
        </div>
        <Modal.CloseButton />
      </Modal.Header>

      <Modal.Body>
        <form id="project-form" onSubmit={handleSubmit} noValidate>
          <FormField label="Project name" htmlFor="project-name" required>
            <input
              id="project-name"
              type="text"
              className="select-field__control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="e.g. Home renovation"
            />
          </FormField>

          <FormField label="Description" htmlFor="project-description" hint="Optional">
            <input
              id="project-description"
              type="text"
              className="select-field__control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              placeholder="What this project covers"
            />
          </FormField>

          <FormField label="Start date" htmlFor="project-start-date" hint="Optional">
            <input
              id="project-start-date"
              type="date"
              className="select-field__control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormField>

          <FormField label="Target completion date" htmlFor="project-target-date" hint="Optional">
            <input
              id="project-target-date"
              type="date"
              className="select-field__control"
              value={targetCompletionDate}
              onChange={(e) => setTargetCompletionDate(e.target.value)}
            />
          </FormField>

          {!initial && (
            <FormField
              label="Forecast"
              htmlFor="project-forecast-description"
              hint="Optional — the budget you expect to spend, line by line"
            >
              <div className="project-form-wizard__forecast-lines">
                {draftLines.map((line) => (
                  <ProjectForecastLineRow
                    key={line.id}
                    line={line}
                    isEditing
                    onChangeForecast={(id, amount) =>
                      setDraftLines((lines) =>
                        lines.map((l) => (l.id === id ? { ...l, forecastAmount: amount } : l)),
                      )
                    }
                    onRemove={removeDraftLine}
                  />
                ))}
                <div className="project-form-wizard__forecast-add-row">
                  <input
                    id="project-forecast-description"
                    type="text"
                    className="select-field__control"
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    placeholder="e.g. Tiling"
                  />
                  <input
                    type="number"
                    min={0}
                    step="1"
                    className="select-field__control"
                    value={draftAmount}
                    onChange={(e) => setDraftAmount(e.target.value)}
                    placeholder="Forecast amount"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addDraftLine}
                    disabled={!draftDescription.trim() || !draftAmount}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </FormField>
          )}

          <FormField
            label="Funding source"
            htmlFor="project-funding"
            hint="Where this project draws money from — not your monthly income"
          >
            <select
              id="project-funding"
              className="select-field__control"
              value={funding}
              onChange={(e) => setFunding(e.target.value)}
            >
              <option value="">— No funding source set —</option>
              {sources.length > 0 && (
                <optgroup label="Accounts">
                  {sources.map((s) => (
                    <option key={s.id} value={`account:${s.id}`}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {sinkingFunds.length > 0 && (
                <optgroup label="Sinking funds">
                  {sinkingFunds.map((f) => (
                    <option key={f.id} value={`fund:${f.id}`}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </FormField>
        </form>

        {error && (
          <p className="form-field__error" role="alert">
            {error}
          </p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" form="project-form" loading={loading}>
          {initial ? 'Save changes' : 'Create project'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
