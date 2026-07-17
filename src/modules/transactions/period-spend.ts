import { TX_TYPE_META, type TxType } from '@/constants/finance';
import { TransactionRepository } from './transactions.repository';

// The single place every "how much did I earn/spend this period" figure in the app goes
// through — the Dashboard summary, the Transactions page, the Calendar widget's budget
// pace, the Subscriptions widget's percent-of-spend, and BudgetEngineService's
// Uncategorized bucket all derive their numbers from this one function. Before this
// module existed, each of those computed its own total independently, and three of them
// drifted apart from the others at different times (a VOID-status filter present in some
// but not others, uncategorized spend silently excluded from one, a stale cache serving
// pre-edit numbers to another) — all invisible to unit tests, since each implementation
// was individually "correct" in isolation. Route new period-total needs through here
// rather than writing a new aggregate query, even a small one.
//
// Caching note: these figures are deliberately NOT cached anywhere in this app (no
// unstable_cache, no revalidateTag wiring exists in this codebase at all). If you add
// caching to a route that calls this function, you must invalidate it in every
// transaction-mutating code path (create/patch/void/delete, recurring-template generate)
// or you will reintroduce exactly the "dashboard shows a stale total" bug this module was
// built to close for good. Prefer not caching money reads at all at this app's scale.

// Classification is derived from TX_TYPE_META.amountSign — the same source
// TransactionService.getPeriodSummary already used — rather than TX_TYPE_GROUPS
// (a different, display-oriented grouping: e.g. REFUND is its own "ADJUSTMENT" group
// there, but still amountSign: 'credit' for accounting purposes). Deriving from one
// canonical field means there is nowhere else to update when a type's classification
// changes — no second hardcoded list to forget.
function typesWithSign(sign: 'debit' | 'credit'): TxType[] {
  return (Object.keys(TX_TYPE_META) as TxType[]).filter(
    (type) => TX_TYPE_META[type].amountSign === sign,
  );
}

export const OUTFLOW_TYPES: TxType[] = typesWithSign('debit');
export const INFLOW_TYPES: TxType[] = typesWithSign('credit');

// Deliberately narrower than OUTFLOW_TYPES — day-to-day spend only, excluding money
// moved into investments or sinking funds. Used by the Calendar widget's no-spend-day
// streak and budget-pace figures, which are tracking spending behavior, not overall
// cash outflow. A day where you only invested isn't a "spend" day in that sense.
export const SPEND_ONLY_TYPES: TxType[] = ['EXPENSE'];

export interface PeriodTotals {
  /** Sum of every credit-type transaction (amountSign: 'credit'), status != VOID. */
  totalIncome: number;
  /** Sum of every debit-type transaction (amountSign: 'debit'), status != VOID. */
  totalExpense: number;
  /** EXPENSE only — the narrower "spend" figure. See SPEND_ONLY_TYPES. */
  totalExpenseOnly: number;
  net: number;
  /** Raw sum per type, for callers that need a figure this module doesn't pre-compose. */
  totalsByType: Partial<Record<TxType, number>>;
  /** Spend with no category assigned, by type — money a category-grouped view would
   *  otherwise silently drop. */
  uncategorizedByType: Partial<Record<TxType, number>>;
}

function sumTypes(types: readonly TxType[], byType: Map<TxType, number>): number {
  return types.reduce((sum, type) => sum + (byType.get(type) ?? 0), 0);
}

/** The one query every period-total figure in this app should be built from. */
export async function getPeriodTotals(
  userId: string,
  year: number,
  month: number,
): Promise<PeriodTotals> {
  const [byTypeRows, uncategorizedRows] = await Promise.all([
    TransactionRepository.sumByTypeForPeriod(userId, year, month),
    TransactionRepository.sumUncategorizedByTypeForPeriod(userId, year, month),
  ]);

  const byType = new Map<TxType, number>(
    byTypeRows.map((r) => [r.type as TxType, r._sum.amount ?? 0]),
  );
  const uncategorizedMap = new Map<TxType, number>(
    uncategorizedRows.map((r) => [r.type as TxType, r._sum.amount ?? 0]),
  );

  const totalIncome = sumTypes(INFLOW_TYPES, byType);
  const totalExpense = sumTypes(OUTFLOW_TYPES, byType);

  return {
    totalIncome,
    totalExpense,
    totalExpenseOnly: sumTypes(SPEND_ONLY_TYPES, byType),
    net: totalIncome - totalExpense,
    totalsByType: Object.fromEntries(byType),
    uncategorizedByType: Object.fromEntries(uncategorizedMap),
  };
}
