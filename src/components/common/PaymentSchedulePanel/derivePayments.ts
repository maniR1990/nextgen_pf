import type { BudgetCategoryNode, BudgetGroup } from '@/modules/budget-engine/budget-engine.types';

export type PaymentStatus = 'overdue' | 'soon' | 'upcoming' | 'paid';

export interface DuePaymentItem {
  id: string;
  name: string;
  /** Planned amount in rupees */
  amount: number;
  dueDay: number;
  paid: boolean;
  /** True when `paid` came from an explicit settlement record rather than the
   *  actual>=planned heuristic — drives whether "Undo" is available and meaningful. */
  isSettled: boolean;
  settledTransactionId: string | null;
  color: string | null;
  icon: string | null;
}

/** Walk the category tree and collect every node that has a dueDay set. */
function collect(nodes: BudgetCategoryNode[], out: DuePaymentItem[]) {
  for (const n of nodes) {
    if (n.dueDay) {
      out.push({
        id: n.id,
        name: n.name,
        amount: n.planned,
        dueDay: n.dueDay,
        // An explicit settlement always wins — it's the only signal that's correct
        // regardless of the settling transaction's type (e.g. a TRANSFER, which never
        // rolls up into `actual`). The actual>=planned check is the fallback for items
        // that were never explicitly settled but happen to look paid by spend alone.
        paid: n.isSettled || (n.planned > 0 && n.actual >= n.planned),
        isSettled: n.isSettled,
        settledTransactionId: n.settledTransactionId,
        color: n.color,
        icon: n.icon,
      });
    }
    if (n.children.length) collect(n.children, out);
  }
}

/** Derive a flat, sorted list of due-payment items from budget groups. */
export function derivePayments(groups: BudgetGroup[]): DuePaymentItem[] {
  const out: DuePaymentItem[] = [];
  for (const g of groups) {
    for (const cat of g.categories) collect([cat], out);
  }
  // Sort by dueDay ASC; within same day paid items go last
  return out.sort((a, b) => a.dueDay - b.dueDay || (a.paid ? 1 : 0) - (b.paid ? 1 : 0));
}

/** Classify urgency of a payment relative to today. */
export function getStatus(
  item: DuePaymentItem,
  todayDay: number,
  isFutureMonth: boolean,
): PaymentStatus {
  if (item.paid) return 'paid';
  if (isFutureMonth) return 'upcoming';
  if (item.dueDay < todayDay) return 'overdue';
  if (item.dueDay - todayDay <= 3) return 'soon';
  return 'upcoming';
}

/** Worst status wins when multiple payments land on the same day. */
const SEVERITY: Record<PaymentStatus, number> = { overdue: 3, soon: 2, upcoming: 1, paid: 0 };
export function worstStatus(statuses: PaymentStatus[]): PaymentStatus {
  return statuses.reduce(
    (worst, s) => (SEVERITY[s] > SEVERITY[worst] ? s : worst),
    'paid' as PaymentStatus,
  );
}

export function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}
