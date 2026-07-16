// Converts any RecurringFrequency into "times per month" so amounts on different
// cadences (annual insurance vs. monthly Netflix) can be summed/compared on one scale.
const MONTHLY_MULTIPLIER: Record<string, number> = {
  MONTHLY: 1,
  TWICE_MONTHLY: 2,
  EVERY_2_MONTHS: 1 / 2,
  QUARTERLY: 1 / 3,
  HALF_YEARLY: 1 / 6,
  ANNUAL: 1 / 12,
};

function monthlyEquivalent(frequency: string, amount: number): number {
  return amount * (MONTHLY_MULTIPLIER[frequency] ?? 1);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export interface SubscriptionTemplateInput {
  id: string;
  name: string;
  frequency: string;
  estimatedAmount: number;
  /** ISO 'YYYY-MM-DD' — computed by the caller since it depends on "now". */
  nextRenewal: string;
  categoryName: string | null;
  accountName: string | null;
}

export interface RecurringTxInput {
  recurringTemplateId: string;
  amount: number;
  date: Date;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  frequency: string;
  nextRenewal: string;
  amount: number;
  /** Set only when the latest charge is higher than the one before it. */
  previousAmount: number | null;
}

export interface PriceIncreaseItem {
  id: string;
  name: string;
  oldAmount: number;
  newAmount: number;
  deltaAmount: number;
  deltaPct: number;
  changedDate: string;
}

export interface BreakdownRow {
  label: string;
  amount: number;
}

export interface SubscriptionData {
  monthlyTotal: number;
  /** % change vs. last known amounts, rounded to 1 decimal. Positive = costs went up. */
  deltaPct: number;
  annualizedTotal: number;
  /** monthlyTotal as % of this period's total expense spend. null when spend is 0/unknown. */
  percentOfSpend: number | null;
  subscriptions: SubscriptionItem[];
  priceIncreases: PriceIncreaseItem[];
  byCategory: BreakdownRow[];
  byAccount: BreakdownRow[];
}

export interface DeriveSubscriptionDataInput {
  templates: SubscriptionTemplateInput[];
  /** Any order — grouped and sorted by date internally. */
  transactions: RecurringTxInput[];
  monthlyExpenseTotal: number;
}

/** Pure derivation of the subscription-audit widget's data from already-fetched
 *  templates + recurring transaction history — kept separate from data fetching so the
 *  price-creep/breakdown logic is unit-testable without a database. */
export function deriveSubscriptionData({
  templates,
  transactions,
  monthlyExpenseTotal,
}: DeriveSubscriptionDataInput): SubscriptionData {
  const historyByTemplate = new Map<string, RecurringTxInput[]>();
  for (const tx of transactions) {
    const list = historyByTemplate.get(tx.recurringTemplateId);
    if (list) list.push(tx);
    else historyByTemplate.set(tx.recurringTemplateId, [tx]);
  }
  for (const list of historyByTemplate.values()) {
    list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  const subscriptions: SubscriptionItem[] = [];
  const priceIncreases: PriceIncreaseItem[] = [];
  const categoryTotals = new Map<string, number>();
  const accountTotals = new Map<string, number>();
  let monthlyTotal = 0;
  let previousMonthlyTotal = 0;

  for (const t of templates) {
    const history = historyByTemplate.get(t.id) ?? [];
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];

    const currentAmount = latest ? latest.amount : t.estimatedAmount;
    // No prior charge to compare against yet — treat as unchanged, not a "decrease".
    const previousAmount = previous ? previous.amount : currentAmount;

    monthlyTotal += monthlyEquivalent(t.frequency, currentAmount);
    previousMonthlyTotal += monthlyEquivalent(t.frequency, previousAmount);

    const categoryLabel = t.categoryName ?? 'Uncategorized';
    categoryTotals.set(
      categoryLabel,
      (categoryTotals.get(categoryLabel) ?? 0) + monthlyEquivalent(t.frequency, currentAmount),
    );
    const accountLabel = t.accountName ?? 'Unassigned';
    accountTotals.set(
      accountLabel,
      (accountTotals.get(accountLabel) ?? 0) + monthlyEquivalent(t.frequency, currentAmount),
    );

    const increased = Boolean(previous) && currentAmount > previousAmount;

    subscriptions.push({
      id: t.id,
      name: t.name,
      frequency: t.frequency,
      nextRenewal: t.nextRenewal,
      amount: currentAmount,
      previousAmount: increased ? previousAmount : null,
    });

    if (increased && latest) {
      const deltaAmount = currentAmount - previousAmount;
      priceIncreases.push({
        id: t.id,
        name: t.name,
        oldAmount: previousAmount,
        newAmount: currentAmount,
        deltaAmount,
        deltaPct: previousAmount > 0 ? round1((deltaAmount / previousAmount) * 100) : 0,
        changedDate: latest.date.toISOString().slice(0, 10),
      });
    }
  }

  subscriptions.sort((a, b) => a.nextRenewal.localeCompare(b.nextRenewal));
  priceIncreases.sort((a, b) => b.deltaPct - a.deltaPct);

  const toRows = (totals: Map<string, number>): BreakdownRow[] =>
    [...totals.entries()]
      .map(([label, amount]) => ({ label, amount: Math.round(amount) }))
      .sort((a, b) => b.amount - a.amount);

  const deltaPct =
    previousMonthlyTotal > 0
      ? round1(((monthlyTotal - previousMonthlyTotal) / previousMonthlyTotal) * 100)
      : 0;

  return {
    monthlyTotal: Math.round(monthlyTotal),
    deltaPct,
    annualizedTotal: Math.round(monthlyTotal * 12),
    percentOfSpend:
      monthlyExpenseTotal > 0 ? Math.round((monthlyTotal / monthlyExpenseTotal) * 100) : null,
    subscriptions,
    priceIncreases,
    byCategory: toRows(categoryTotals),
    byAccount: toRows(accountTotals),
  };
}
