import { BudgetPeriodInvalidError, CategoryNotFoundError } from '@/lib/api/errors';
import { TransactionRepository } from '@/modules/transactions/transactions.repository';
import { BudgetEngineRepository } from './budget-engine.repository';

const NOW = () => new Date();
const MAX_FUTURE_MONTHS = 24;

function validatePeriod(year: number, month: number) {
  const now = NOW();
  if (year < 2020 || month < 1 || month > 12) throw new BudgetPeriodInvalidError();
  const monthsAhead = (year - now.getFullYear()) * 12 + (month - now.getMonth() - 1);
  if (monthsAhead > MAX_FUTURE_MONTHS) throw new BudgetPeriodInvalidError();
}

export const BudgetEngineService = {
  async getMonthlySummary(userId: string, year: number, month: number) {
    validatePeriod(year, month);

    const [categories, overrides] = await Promise.all([
      BudgetEngineRepository.findCategoriesForUser(userId),
      BudgetEngineRepository.findOverrides(userId, year, month),
    ]);

    const overrideMap = new Map(overrides.map((o) => [o.categoryId, o.planned]));

    const enriched = await Promise.all(
      categories.map(async (cat) => {
        const plannedAmount = overrideMap.get(cat.id) ?? cat.plannedAmount ?? 0;
        const agg = await TransactionRepository.sumByPeriod(userId, year, month, cat.id);
        const spentAmount = agg._sum.amount ?? 0;
        const remainingAmount = plannedAmount - spentAmount;
        const percentUsed = plannedAmount > 0 ? Math.round((spentAmount / plannedAmount) * 100) : 0;
        return { ...cat, plannedAmount, spentAmount, remainingAmount, percentUsed };
      }),
    );

    const totalPlanned = enriched.reduce((s, c) => s + c.plannedAmount, 0);
    const totalSpent = enriched.reduce((s, c) => s + c.spentAmount, 0);

    return {
      year,
      month,
      categories: enriched,
      totals: { totalPlanned, totalSpent, totalRemaining: totalPlanned - totalSpent },
    };
  },

  async getImpact(
    userId: string,
    input: {
      categoryId: string;
      amount: number;
      budgetPeriodYear: number;
      budgetPeriodMonth: number;
    },
  ) {
    validatePeriod(input.budgetPeriodYear, input.budgetPeriodMonth);

    const cat = await BudgetEngineRepository.findCategoryById(input.categoryId, userId);
    if (!cat) throw new CategoryNotFoundError();

    const overrides = await BudgetEngineRepository.findOverrides(
      userId,
      input.budgetPeriodYear,
      input.budgetPeriodMonth,
    );
    const plannedAmount =
      overrides.find((o) => o.categoryId === input.categoryId)?.planned ?? cat.plannedAmount ?? 0;

    const agg = await TransactionRepository.sumByPeriod(
      userId,
      input.budgetPeriodYear,
      input.budgetPeriodMonth,
      input.categoryId,
    );
    const currentSpend = agg._sum.amount ?? 0;
    const projectedSpend = currentSpend + input.amount;
    const remainingAfter = plannedAmount - projectedSpend;
    const willExceed = projectedSpend > plannedAmount;

    return {
      categoryId: input.categoryId,
      categoryLabel: cat.label,
      plannedAmount,
      currentSpend,
      projectedSpend,
      remainingAfter,
      willExceed,
      percentUsedAfter: plannedAmount > 0 ? Math.round((projectedSpend / plannedAmount) * 100) : 0,
    };
  },

  async getCategoryBudgets(userId: string, year: number, month: number) {
    validatePeriod(year, month);
    const [categories, overrides] = await Promise.all([
      BudgetEngineRepository.findCategoriesForUser(userId),
      BudgetEngineRepository.findOverrides(userId, year, month),
    ]);
    const overrideMap = new Map(overrides.map((o) => [o.categoryId, o.planned]));
    return categories.map((cat) => ({
      ...cat,
      plannedAmount: overrideMap.get(cat.id) ?? cat.plannedAmount ?? 0,
    }));
  },

  async updateCategoryPlanned(
    userId: string,
    year: number,
    month: number,
    categoryId: string,
    planned: number,
  ) {
    validatePeriod(year, month);
    const cat = await BudgetEngineRepository.findCategoryById(categoryId, userId);
    if (!cat) throw new CategoryNotFoundError();
    return BudgetEngineRepository.upsertOverride(userId, year, month, categoryId, planned);
  },
};
