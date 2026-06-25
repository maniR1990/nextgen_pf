'use client';

/**
 * TransactionDialog — production-ready transaction entry dialog.
 *
 * Server component usage (zero loading state):
 *   const options = await loadTransactionOptions(userId);  // server-side
 *   return <TransactionDialog open={...} onClose={...} initialOptions={options} />;
 *
 * Client-only usage (data fetched on open):
 *   return <TransactionDialog open={...} onClose={...} />;
 */

import { useQueryClient } from '@tanstack/react-query';
import { AddTransactionModal } from '@/components/features/transactions/AddTransactionModal';
import { useFormOptions } from './hooks/useFormOptions';
import { queryKeys } from '@/lib/query/queryKeys';
import type { FormOptions } from './hooks/useFormOptions';
import type { PaymentSourceOption, CategoryOption, SinkingFundOption } from '@/types/finance';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import type { TransactionFormValues } from '@/store/transactionFormStore';

export interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fetched by a server component — eliminates loading state entirely. */
  initialOptions?: FormOptions;
  /** Called after a successful submission so the parent can invalidate queries. */
  onSuccess?: () => void;
  /** When set, opens modal in edit mode with this transaction's data pre-filled. */
  editId?: string;
  prefillValues?: Partial<TransactionFormValues>;
}

function toPaymentSourceOption(s: FormOptions['sources'][number]): PaymentSourceOption {
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    balance: s.currentBalance,
    bank: s.bank ?? undefined,
  };
}

function toCategoryOption(c: FormOptions['categories'][number]): CategoryOption {
  return {
    id: c.id,
    label: c.label,
    parentLabel: c.parentLabel,
    depth: c.depth,
    plannedAmount: c.plannedAmount ?? undefined,
    type: c.type as CategoryOption['type'],
    icon: c.icon,
    color: c.color,
  };
}

function toSinkingFundOption(f: FormOptions['sinkingFunds'][number]): SinkingFundOption {
  return {
    id: f.id,
    label: f.label,
    target: f.target,
    saved: f.saved,
    monthly: f.monthly,
  };
}

export function TransactionDialog({ open, onClose, initialOptions, onSuccess, editId, prefillValues }: TransactionDialogProps) {
  const queryClient = useQueryClient();
  const { sources, categories, categoryGroups, sinkingFunds, isLoading } = useFormOptions(initialOptions);

  const handleClose = () => {
    onClose();
    if (onSuccess) {
      // Invalidate transaction list and budget queries so the UI refreshes
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    }
  };

  async function handleCreateCategory(name: string, parentId: string | null): Promise<string> {
    const res = await fetch('/api/v1/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ...(parentId ? { parentId } : {}) }),
    });
    if (!res.ok) throw new Error('Failed to create category');
    const json = await res.json();
    queryClient.invalidateQueries({ queryKey: queryKeys.formOptions.categories() });
    return json.data.id as string;
  }

  return (
    <AddTransactionModal
      open={open}
      onClose={handleClose}
      paymentSources={isLoading ? [] : sources.map(toPaymentSourceOption)}
      categories={isLoading ? [] : categories.map(toCategoryOption)}
      categoryGroups={isLoading ? [] : categoryGroups}
      sinkingFunds={isLoading ? [] : sinkingFunds.map(toSinkingFundOption)}
      onCreateCategory={handleCreateCategory}
      editId={editId}
      prefillValues={prefillValues}
    />
  );
}
