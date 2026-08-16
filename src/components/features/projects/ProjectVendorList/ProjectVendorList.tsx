'use client';

import { Button } from '@/components/ui/Button';
import { useAddVendor, useRemoveVendor, useUpdateVendor } from '@/hooks/useProjects';
import type { ProjectSummary } from '@/hooks/useProjects';
import { Edit2, Link2, Trash2 } from 'lucide-react';
import { useState } from 'react';

export interface ProjectVendorListProps {
  projectId: string;
  vendors: ProjectSummary['vendors'];
  /** Used only to find the forecast line (if any) linked back to a vendor —
   *  see the Overview UX review, "surface the vendor-forecast link". */
  forecastLines: ProjectSummary['forecastLines'];
}

/**
 * Stays a single inline line when there's one vendor (the common case), grows
 * to a real list only once a second vendor is added — same data model either
 * way, per plan doc Slice 4.
 */
export function ProjectVendorList({ projectId, vendors, forecastLines }: ProjectVendorListProps) {
  const addVendor = useAddVendor(projectId);
  const updateVendor = useUpdateVendor(projectId);
  const removeVendor = useRemoveVendor(projectId);
  const [name, setName] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');

  async function handleAdd() {
    const amt = Number(contractAmount);
    if (!name.trim() || !amt || amt <= 0) return;
    await addVendor.mutateAsync({ name: name.trim(), contractAmount: amt });
    setName('');
    setContractAmount('');
    setAdding(false);
  }

  function startEdit(vendor: ProjectSummary['vendors'][number]) {
    setEditingId(vendor.id);
    setEditName(vendor.name);
    setEditAmount(String(vendor.contractAmount));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditAmount('');
  }

  async function handleSaveEdit(vendorId: string) {
    const amt = Number(editAmount);
    if (!editName.trim() || !amt || amt <= 0) return;
    await updateVendor.mutateAsync({ vendorId, name: editName.trim(), contractAmount: amt });
    cancelEdit();
  }

  return (
    <div className="project-overview__vendors">
      <span className="project-overview__field-label">
        {vendors.length > 1 ? 'Vendors' : 'Vendor'}
      </span>

      {vendors.map((vendor) => {
        if (editingId === vendor.id) {
          return (
            <div key={vendor.id} className="project-budget-forecast__add-row">
              <input
                type="text"
                className="select-field__control"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Vendor name"
                aria-label="Vendor name"
              />
              <input
                type="number"
                min={0}
                step="1"
                className="select-field__control"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="Contract amount"
                aria-label="Contract amount"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSaveEdit(vendor.id)}
                disabled={!editName.trim() || !editAmount}
                loading={updateVendor.isPending}
              >
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          );
        }

        const paid = vendor.contractAmount - vendor.balance;
        const linkedLine = forecastLines.find((l) => l.vendorId === vendor.id);
        const paidPct =
          vendor.contractAmount > 0 ? Math.min(100, (paid / vendor.contractAmount) * 100) : 0;
        return (
          <div key={vendor.id} className="project-vendor-row">
            <div>
              <div className="project-vendor-row__name">{vendor.name}</div>
              {linkedLine && (
                <div className="project-vendor-row__link">
                  <Link2 size={11} aria-hidden />
                  linked to {linkedLine.description}
                </div>
              )}
            </div>
            <div className="project-vendor-row__amounts">
              <span>
                ₹{paid.toLocaleString('en-IN')} of ₹{vendor.contractAmount.toLocaleString('en-IN')}{' '}
                paid
              </span>
              <span className="project-vendor-row__balance">
                Balance ₹{vendor.balance.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="project-vendor-row__actions">
              <button
                type="button"
                className="project-forecast-line-row__remove"
                onClick={() => startEdit(vendor)}
                aria-label={`Edit ${vendor.name}`}
              >
                <Edit2 size={14} aria-hidden />
              </button>
              <button
                type="button"
                className="project-forecast-line-row__remove"
                onClick={() => removeVendor.mutate(vendor.id)}
                aria-label={`Remove ${vendor.name}`}
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
            <div className="project-vendor-row__bar">
              <div className="project-vendor-row__bar-fill" style={{ width: `${paidPct}%` }} />
            </div>
          </div>
        );
      })}

      {adding ? (
        <div className="project-budget-forecast__add-row">
          <input
            type="text"
            className="select-field__control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vendor name"
          />
          <input
            type="number"
            min={0}
            step="1"
            className="select-field__control"
            value={contractAmount}
            onChange={(e) => setContractAmount(e.target.value)}
            placeholder="Contract amount"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAdd}
            disabled={!name || !contractAmount}
            loading={addVendor.isPending}
          >
            Add
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          + Add vendor
        </Button>
      )}
    </div>
  );
}
