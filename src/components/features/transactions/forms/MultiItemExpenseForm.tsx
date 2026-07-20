'use client';

import { CategoryPicker } from '@/components/common/CategoryPicker';
import type { CategoryPickerOption } from '@/components/common/CategoryPicker';
import type { BulkItemDraft } from '@/store/transactionFormStore';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import { useTransactionFormStore } from '@/store/transactionFormStore';
import { Plus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface MultiItemExpenseFormProps {
  categoryGroups: PickerGroup[];
  onCreateCategory?: (name: string, parentId: string | null, flowType?: string) => Promise<string>;
}

type CreateCategoryFn = (
  name: string,
  parentId: string | null,
  flowType?: string,
) => Promise<string>;

function formatINR(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

function isResolved(item: { categoryId: string; amount: string }): boolean {
  return !!item.categoryId && Number.parseFloat(item.amount) > 0;
}

// Flattens the 3-level group tree into one search-and-select list — every category and
// subcategory node (a childless L1, every L2, every L3) with its breadcrumb as
// parentLabel. Doubles as both "pick an existing item directly" (e.g. "chicken — Meat")
// and "pick where a new item should nest" (e.g. "Meat — Grocery"), since L1/L2 nodes
// with children are included here too, not just leaves. A bulk bill row needs
// "type the item, pick it," not a multi-column drill-down: with several rows on screen
// at once, a full cascading picker's always-on search bar + up to three columns per row
// reads as noisy compared to one compact trigger that expands into a flat dropdown.
function flattenGroupsToOptions(groups: PickerGroup[]): CategoryPickerOption[] {
  const options: CategoryPickerOption[] = [];
  for (const group of groups) {
    for (const l1 of group.children) {
      options.push({ id: l1.id, label: l1.name, parentLabel: group.name });
      for (const l2 of l1.children) {
        options.push({ id: l2.id, label: l2.name, parentLabel: l1.name });
        for (const l3 of l2.children) {
          options.push({ id: l3.id, label: l3.name, parentLabel: `${l1.name} › ${l2.name}` });
        }
      }
    }
  }
  return options;
}

// Enter inside a row field would otherwise bubble to AddTransactionModal's <form> and
// submit the whole bill mid-entry — block it here so Enter only ever commits the field.
function blockEnterSubmit(e: React.KeyboardEvent) {
  if (e.key === 'Enter') e.preventDefault();
}

interface ItemRowProps {
  item: BulkItemDraft;
  index: number;
  isInvalid: boolean;
  canRemove: boolean;
  flatOptions: CategoryPickerOption[];
  onCreateCategory?: CreateCategoryFn;
  onCategoryCreated: (option: CategoryPickerOption) => void;
  onUpdate: (patch: Partial<Omit<BulkItemDraft, 'id'>>) => void;
  onRemove: () => void;
}

function ItemRow({
  item,
  index,
  isInvalid,
  canRemove,
  flatOptions,
  onCreateCategory,
  onCategoryCreated,
  onUpdate,
  onRemove,
}: ItemRowProps) {
  // Set the moment the fast path's "Create X" is used — swaps the row's picker for a
  // second compact search asking where the new item belongs, instead of always flattening
  // new items to a top-level category. Local to this row: two rows can be mid-create at
  // once without fighting over shared state.
  const [pendingName, setPendingName] = useState<string | null>(null);
  // Mirrors pendingName but updates synchronously — CategoryPicker's onCreate flow always
  // calls onChange right after onCreate resolves (its own auto-select behavior), and when
  // the picked value came from a brand-new PARENT category, our onCreate wrapper below has
  // already placed the pending item using that same id before onCreate returns. The
  // subsequent onChange fires from a still-stale closure (React hasn't re-rendered with
  // pendingName cleared yet), so a check against the state value alone doesn't stop the
  // second, duplicate placement — the ref clears the instant the first call starts, so the
  // second call sees it's already spoken for.
  const pendingNameRef = useRef<string | null>(null);
  pendingNameRef.current = pendingName;

  async function placePendingUnder(parentId: string) {
    const name = pendingNameRef.current;
    if (!name || !onCreateCategory) return;
    pendingNameRef.current = null;
    const newId = await onCreateCategory(name, parentId);
    // The parent's category-tree query won't refetch (and thus recognize this new id in
    // `options`) for at least one more round trip. Without this, the picker's trigger
    // falls back to its placeholder text right after a successful create — indistinguishable
    // from "nothing selected," even though categoryId is already correctly set underneath.
    const parentOption = flatOptions.find((o) => o.id === parentId);
    onCategoryCreated({ id: newId, label: name, parentLabel: parentOption?.label });
    onUpdate({ categoryId: newId });
    setPendingName(null);
  }

  if (pendingName) {
    return (
      <div className="multi-item-form__row multi-item-form__row--resolving">
        <div className="multi-item-form__resolve">
          <span className="multi-item-form__resolve-label">
            Place &quot;{pendingName}&quot; under…
          </span>
          <div className="multi-item-form__resolve-picker">
            <CategoryPicker
              options={flatOptions}
              value={null}
              onChange={(parentId) => {
                if (parentId) void placePendingUnder(parentId);
              }}
              placeholder="Search category…"
              onCreate={
                onCreateCategory
                  ? async (newParentName) => {
                      const newParentId = await onCreateCategory(newParentName, null, 'EXPENSE');
                      onCategoryCreated({ id: newParentId, label: newParentName });
                      await placePendingUnder(newParentId);
                      return newParentId;
                    }
                  : undefined
              }
            />
          </div>
          <button
            type="button"
            className="multi-item-form__resolve-cancel"
            onClick={() => setPendingName(null)}
          >
            Cancel
          </button>
        </div>
        <button
          type="button"
          className="multi-item-form__row-remove"
          onClick={onRemove}
          aria-label={`Remove item ${index + 1}`}
          disabled={!canRemove}
          title={!canRemove ? 'At least one item is required' : 'Remove item'}
        >
          <X size={14} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="multi-item-form__row">
      <div className="multi-item-form__row-category">
        <CategoryPicker
          options={flatOptions}
          value={item.categoryId || null}
          onChange={(id) => {
            // CategoryPicker always calls onChange right after onCreate resolves (its own
            // auto-select behavior). Our onCreate below hijacks the create — nothing was
            // actually selected, just a pending name captured — and returns '' as a
            // placeholder return value, which is not a real selection. Committing it here
            // would wipe out whatever category this row already had the moment "Create X"
            // is clicked, even before the user finishes (or cancels) placing the new item.
            if (id === '') return;
            onUpdate({ categoryId: id ?? '' });
          }}
          placeholder="Select category…"
          error={isInvalid && !item.categoryId ? 'Required' : undefined}
          priorityParentLabel="Expenses"
          onCreate={
            onCreateCategory
              ? (name) => {
                  setPendingName(name);
                  return Promise.resolve('');
                }
              : undefined
          }
        />
      </div>
      <div className="multi-item-form__row-amount">
        <span className="multi-item-form__currency">₹</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="0"
          className={[
            'multi-item-form__row-amount-input',
            isInvalid && !(Number.parseFloat(item.amount) > 0)
              ? 'multi-item-form__row-amount-input--error'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          value={item.amount}
          onChange={(e) => onUpdate({ amount: e.target.value })}
          onKeyDown={blockEnterSubmit}
          aria-label={`Amount for item ${index + 1}`}
        />
      </div>
      <button
        type="button"
        className="multi-item-form__row-remove"
        onClick={onRemove}
        aria-label={`Remove item ${index + 1}`}
        disabled={!canRemove}
        title={!canRemove ? 'At least one item is required' : 'Remove item'}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}

export function MultiItemExpenseForm({
  categoryGroups,
  onCreateCategory,
}: MultiItemExpenseFormProps) {
  const items = useTransactionFormStore((s) => s.items);
  const invalidItemIds = useTransactionFormStore((s) => s.invalidItemIds);
  const addItem = useTransactionFormStore((s) => s.addItem);
  const updateItem = useTransactionFormStore((s) => s.updateItem);
  const removeItem = useTransactionFormStore((s) => s.removeItem);

  // Categories created THIS session, merged into flatOptions until categoryGroups itself
  // catches up via refetch — see the comment in placePendingUnder for why this exists.
  // Shared across all rows (not per-row) so creating "egg" in row 1 makes it immediately
  // findable from row 2's picker too, not just resolved-but-invisible in row 1's own.
  const [locallyCreated, setLocallyCreated] = useState<CategoryPickerOption[]>([]);
  const recordCreated = (option: CategoryPickerOption) =>
    setLocallyCreated((prev) => (prev.some((o) => o.id === option.id) ? prev : [...prev, option]));

  const flatOptions = useMemo(
    () => [...flattenGroupsToOptions(categoryGroups), ...locallyCreated],
    [categoryGroups, locallyCreated],
  );
  const total = items.reduce((sum, it) => sum + (Number.parseFloat(it.amount) || 0), 0);

  // Auto-advance: the moment the last row gets both a category and an amount, a fresh
  // blank row appears on its own — no "Add item" click needed for the common case.
  //
  // Tracked by item id, not a plain "was the last row resolved" boolean: removing a
  // freshly-auto-added blank row reveals the previous (already-resolved) row as the
  // new last item, which would otherwise look like a fresh resolve → re-adding a row
  // that shouldn't exist. An id already seen here never fires again.
  const lastItem = items[items.length - 1];
  const autoAdvancedIds = useRef(new Set<string>());
  useEffect(() => {
    if (!lastItem || !isResolved(lastItem)) return;
    if (autoAdvancedIds.current.has(lastItem.id)) return;
    autoAdvancedIds.current.add(lastItem.id);
    addItem();
  }, [lastItem, addItem]);

  const lastRowResolved = !lastItem || isResolved(lastItem);

  return (
    <div className="multi-item-form">
      <div className="multi-item-form__header">
        <span className="multi-item-form__label">Items</span>
        <span className="multi-item-form__total">
          {items.length} item{items.length === 1 ? '' : 's'} · {formatINR(total)}
        </span>
      </div>

      <div className="multi-item-form__rows">
        {items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            index={index}
            isInvalid={invalidItemIds.includes(item.id)}
            canRemove={items.length > 1}
            flatOptions={flatOptions}
            onCreateCategory={onCreateCategory}
            onCategoryCreated={recordCreated}
            onUpdate={(patch) => updateItem(item.id, patch)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </div>

      <button
        type="button"
        className="multi-item-form__add"
        onClick={() => addItem()}
        disabled={!lastRowResolved}
        title={!lastRowResolved ? 'Finish the current item first' : 'Add another item'}
      >
        <Plus size={14} aria-hidden />
        Add item
      </button>
    </div>
  );
}
