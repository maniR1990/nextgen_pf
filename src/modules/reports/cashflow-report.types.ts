export interface FundGroupLineItem {
  fundGroupId: string;
  fundGroupName: string;
  fundGroupColor: string | null;
  totalAmount: number;
  pct: number | null;
}

export interface CashflowReportData {
  year: number;
  month: number;

  totalIncome: number;
  incomeSourceLabel: string;

  totalSavings: number;
  savingsBreakdown: FundGroupLineItem[];
  savingsPct: number | null;

  totalFundUsed: number;
  fundUsed: FundGroupLineItem[];

  expensesTotal: number;
  expensesPct: number | null;

  remaining: number;
  remainingPct: number | null;

  denominator: number;
}

export interface FundGroupContributionResult {
  netContributed: number;
  progressPct: number | null;
}
