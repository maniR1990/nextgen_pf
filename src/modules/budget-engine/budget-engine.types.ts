export interface BudgetCategoryNode {
  id: string;
  name: string;
  level: number;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  /** True for the synthetic "Uncategorized" row — spend with no real category assigned,
   *  surfaced so it's never silently missing from a group's total. Not a real Category
   *  row: has no id a write endpoint can act on, so the UI must not offer to edit,
   *  rename, delete, or add children under it. */
  isVirtual: boolean;
  isRecurring: boolean;
  isUnplanned: boolean;
  /** Day of month (1–31) this item is typically due. null = no due date set. */
  dueDay: number | null;
  /** True once this period's due item has been settled (paid), regardless of whether
   *  the settling transaction's type/category rolls up into `actual` below — e.g. a
   *  TRANSFER never does. Independent of the actual>=planned heuristic. */
  isSettled: boolean;
  /** The transaction that settled this period, if one was linked (Quick Pay). */
  settledTransactionId: string | null;
  /** Rolled-up planned amount: sum of children if any, else own plan. */
  planned: number;
  /** Rolled-up actual spend for this period. */
  actual: number;
  /** Actual spend in the previous calendar month — used for trend comparison. */
  lastMonthActual: number;
  /** actual - planned */
  variance: number;
  variancePct: number;
  /** actual / planned * 100. Uncapped. */
  progressPct: number;
  children: BudgetCategoryNode[];
}

export interface BudgetGroup {
  id: string;
  name: string;
  /** INCOME | EXPENSE | INVESTMENT | TRANSFER */
  type: string;
  planned: number;
  actual: number;
  lastMonthActual: number;
  variance: number;
  variancePct: number;
  progressPct: number;
  categories: BudgetCategoryNode[];
}

export interface BudgetSummaryResponse {
  year: number;
  month: number;
  groups: BudgetGroup[];
}
