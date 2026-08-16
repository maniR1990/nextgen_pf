'use client';

import { Button } from '@/components/ui/Button';
import { useAddForecastLine, useProjectDetail, useRemoveForecastLine } from '@/hooks/useProjects';
import { useState } from 'react';
import { ProjectForecastLineRow } from '../ProjectForecastLineRow';

export interface ProjectBudgetForecastProps {
  projectId: string;
}

export function ProjectBudgetForecast({ projectId }: ProjectBudgetForecastProps) {
  const { data: project, isLoading } = useProjectDetail(projectId);
  const addLine = useAddForecastLine(projectId);
  const removeLine = useRemoveForecastLine(projectId);

  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newVendorId, setNewVendorId] = useState('');

  if (isLoading) return <p className="page-text">Loading…</p>;
  if (!project) return <p className="page-text">Project not found.</p>;

  async function handleAdd() {
    const amount = Number(newAmount);
    if (!newDescription.trim() || !amount || amount <= 0) return;
    await addLine.mutateAsync({
      description: newDescription.trim(),
      forecastAmount: amount,
      ...(newVendorId && { vendorId: newVendorId }),
    });
    setNewDescription('');
    setNewAmount('');
    setNewVendorId('');
  }

  return (
    <div className="project-budget-forecast">
      <div className="project-budget-forecast__total">
        <span className="project-overview__field-label">Total forecast</span>
        <span className="project-budget-forecast__total-amount">
          ₹{project.forecastTotal.toLocaleString('en-IN')}
        </span>
      </div>

      <div
        className={
          project.vendors.length > 0
            ? 'project-budget-forecast__add-row project-budget-forecast__add-row--with-vendor'
            : 'project-budget-forecast__add-row'
        }
      >
        <input
          type="text"
          className="select-field__control"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="e.g. Tiling"
          aria-label="New forecast line description"
        />
        <input
          type="number"
          min={0}
          step="1"
          className="select-field__control project-budget-forecast__add-amount"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          placeholder="Forecast amount"
          aria-label="New forecast line amount"
        />
        {project.vendors.length > 0 && (
          <select
            className="select-field__control"
            value={newVendorId}
            onChange={(e) => setNewVendorId(e.target.value)}
            aria-label="Vendor for this forecast line"
          >
            <option value="">No vendor</option>
            {project.vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        )}
        <Button
          variant="secondary"
          onClick={handleAdd}
          disabled={!newDescription.trim() || !newAmount}
          loading={addLine.isPending}
        >
          Add line
        </Button>
      </div>

      <div className="project-budget-forecast__list">
        {project.forecastLines.map((line) => (
          <ProjectForecastLineRow
            key={line.id}
            line={line}
            onRemove={(lineId) => removeLine.mutate(lineId)}
          />
        ))}
        {project.forecastLines.length === 0 && (
          <p className="page-text">No forecast lines yet — add one above.</p>
        )}
      </div>
    </div>
  );
}
