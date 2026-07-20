'use client';

import { AddTransactionModal } from '@/components/features/transactions/AddTransactionModal';
import { apiPostV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import type { TransactionFormValues } from '@/store/transactionFormStore';
import type { CategoryOption, PaymentSourceOption, SinkingFundOption } from '@/types/finance';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormOptions } from './hooks/useFormOptions';
import type { FormOptions } from './hooks/useFormOptions';

export interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fetched by a server component — eliminates loading state entirely. */
  initialOptions?: FormOptions;
  /** Called after a successful submission so the parent can trigger extra side-effects. */
  onSuccess?: () => void;
  /** When set, opens modal in edit mode with this transaction's data pre-filled. */
  editId?: string;
  prefillValues?: Partial<TransactionFormValues>;
  /** Opens straight into "Split into multiple items" mode — see AddTransactionModal. */
  initialMultiItem?: boolean;
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
  return { id: f.id, label: f.label, target: f.target, saved: f.saved, monthly: f.monthly };
}

/**
 * parentId is only ever null for a "main category" create (the picker's L1 column, e.g.
 * adding "Personal Care" alongside "Groceries"). That should land as a level-1 child of
 * the existing group matching flowType ("Expenses"/"Income"/…) — but the categories API
 * defaults to creating a brand-new level-0 GROUP when no parentId is given at all, which
 * is a different thing entirely (a sibling of "Expenses" itself, not a category inside
 * it). Resolve the real group id from the already-loaded categoryGroups so the new
 * category nests where the UI actually implies. PickerGroup.type is lowercase
 * ('expense') while flowType arrives uppercase ('EXPENSE') from the form — compare
 * case-insensitively.
 */
export function resolveCreateCategoryParentId(
  categoryGroups: PickerGroup[],
  parentId: string | null,
  flowType?: string,
): string | null {
  if (parentId) return parentId;
  if (!flowType) return null;
  return categoryGroups.find((g) => g.type.toLowerCase() === flowType.toLowerCase())?.id ?? null;
}

export function TransactionDialog({
  open,
  onClose,
  initialOptions,
  onSuccess,
  editId,
  prefillValues,
  initialMultiItem,
}: TransactionDialogProps) {
  const qc = useQueryClient();
  const { sources, categories, categoryGroups, sinkingFunds, isLoading } =
    useFormOptions(initialOptions);

  // Mutation for inline category creation inside the transaction form
  const createCategory = useMutation({
    mutationFn: ({
      name,
      parentId,
      type,
    }: {
      name: string;
      parentId: string | null;
      type?: string;
    }) => {
      const body: Record<string, unknown> = { name };
      if (parentId) body.parentId = parentId;
      else if (type) body.type = type.toUpperCase();
      return apiPostV1<{ id: string }>('/api/v1/categories', body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      void qc.invalidateQueries({ queryKey: queryKeys.formOptions.categories() });
    },
  });

  const handleClose = () => {
    onClose();
    onSuccess?.();
  };

  async function handleCreateCategory(
    name: string,
    parentId: string | null,
    flowType?: string,
  ): Promise<string> {
    const resolvedParentId = resolveCreateCategoryParentId(categoryGroups, parentId, flowType);
    const result = await createCategory.mutateAsync({
      name,
      parentId: resolvedParentId,
      type: flowType,
    });
    return result.id;
  }

  return (
    <AddTransactionModal
      open={open}
      onClose={handleClose}
      paymentSources={isLoading ? [] : sources.map(toPaymentSourceOption)}
      categories={isLoading ? [] : categories.map(toCategoryOption)}
      categoryGroups={isLoading ? [] : (categoryGroups as PickerGroup[])}
      sinkingFunds={isLoading ? [] : sinkingFunds.map(toSinkingFundOption)}
      onCreateCategory={handleCreateCategory}
      editId={editId}
      prefillValues={prefillValues}
      initialMultiItem={initialMultiItem}
    />
  );
}

export type { FormOptions };
