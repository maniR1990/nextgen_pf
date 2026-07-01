export interface BudgetCategoryNode {
  id: string;
  name: string;
  level: number;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  isRecurring: boolean;
  isUnplanned: boolean;
  /** Day of month (1–31) this item is typically due. null = no due date set. */
  dueDay: number | null;
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
