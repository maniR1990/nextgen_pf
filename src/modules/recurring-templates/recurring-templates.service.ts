import { ConflictError, NotFoundError } from '@/lib/api/errors';
import { RecurringTemplatesRepository } from './recurring-templates.repository';
import type {
  CreateRecurringTemplateDto,
  PatchRecurringTemplateDto,
} from './recurring-templates.types';

function assertOwned(template: { userId: string }, userId: string) {
  if (template.userId !== userId) throw new NotFoundError('Recurring template not found');
}

function clampDay(day: number, year: number, month: number) {
  return Math.min(day, new Date(year, month + 1, 0).getDate());
}

function addMonths(year: number, month: number, n: number): [number, number] {
  let m = month + n;
  let y = year;
  while (m > 11) {
    m -= 12;
    y += 1;
  }
  return [y, m];
}

/** Returns the next N future occurrence dates based on template frequency. */
export function computeOccurrences(
  template: {
    frequency: string;
    dayOfMonth: number | null;
    secondDayOfMonth?: number | null;
    months: number[];
  },
  count: number,
  referenceDate: Date = new Date(),
): Date[] {
  const result: Date[] = [];
  const now = new Date(referenceDate); // clone — setHours below must not mutate the caller's Date
  now.setHours(23, 59, 59, 999); // treat today as past

  const day1 = template.dayOfMonth ?? 1;

  if (template.frequency === 'TWICE_MONTHLY') {
    const day2 = template.secondDayOfMonth ?? 15;
    let year = now.getFullYear();
    let month = now.getMonth();

    while (result.length < count) {
      const candidates = [
        new Date(year, month, clampDay(day1, year, month)),
        new Date(year, month, clampDay(day2, year, month)),
      ].sort((a, b) => a.getTime() - b.getTime());

      for (const c of candidates) {
        if (c > now && result.length < count) result.push(c);
      }
      [year, month] = addMonths(year, month, 1);
    }
    return result;
  }

  const intervalMonths =
    template.frequency === 'EVERY_2_MONTHS'
      ? 2
      : template.frequency === 'QUARTERLY'
        ? 3
        : template.frequency === 'HALF_YEARLY'
          ? 6
          : template.frequency === 'ANNUAL'
            ? 12
            : 1;

  let year = now.getFullYear();
  let month = now.getMonth();

  // Advance by full interval until candidate is in the future
  let candidate = new Date(year, month, clampDay(day1, year, month));
  while (candidate <= now) {
    [year, month] = addMonths(year, month, intervalMonths);
    candidate = new Date(year, month, clampDay(day1, year, month));
  }

  while (result.length < count) {
    result.push(new Date(year, month, clampDay(day1, year, month)));
    [year, month] = addMonths(year, month, intervalMonths);
  }

  return result;
}

export const RecurringTemplatesService = {
  async list(userId: string) {
    return RecurringTemplatesRepository.findByUserId(userId);
  },

  async create(userId: string, dto: CreateRecurringTemplateDto) {
    return RecurringTemplatesRepository.create({
      user: { connect: { id: userId } },
      name: dto.name,
      type: dto.type as never,
      frequency: dto.frequency as never,
      dayOfMonth: dto.dayOfMonth,
      secondDayOfMonth: dto.secondDayOfMonth,
      months: dto.months ?? [],
      estimatedAmount: dto.estimatedAmount,
      budgetType: (dto.budgetType ?? 'NONE') as never,
      tags: dto.tags ?? [],
      ...(dto.categoryId && { category: { connect: { id: dto.categoryId } } }),
      ...(dto.accountId && { account: { connect: { id: dto.accountId } } }),
      ...(dto.toAccountId && { toAccount: { connect: { id: dto.toAccountId } } }),
      ...(dto.fundGroupId && {
        fundGroupId: dto.fundGroupId,
        fundGroupFlow: dto.fundGroupFlow as never,
      }),
    });
  },

  async update(id: string, userId: string, dto: PatchRecurringTemplateDto) {
    const template = await RecurringTemplatesRepository.findById(id);
    assertOwned(template, userId);
    return RecurringTemplatesRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.estimatedAmount !== undefined && { estimatedAmount: dto.estimatedAmount }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.dayOfMonth !== undefined && { dayOfMonth: dto.dayOfMonth }),
      ...(dto.categoryId !== undefined && { category: { connect: { id: dto.categoryId } } }),
      ...(dto.accountId !== undefined && { account: { connect: { id: dto.accountId } } }),
    });
  },

  async previewOccurrences(id: string, userId: string, count = 5) {
    const template = await RecurringTemplatesRepository.findById(id);
    assertOwned(template, userId);
    const dates = computeOccurrences(template, Math.min(count, 12));
    return {
      templateId: id,
      occurrences: dates.map((date) => ({ date, estimatedAmount: template.estimatedAmount })),
    };
  },

  async generate(id: string, userId: string) {
    const template = await RecurringTemplatesRepository.findById(id);
    assertOwned(template, userId);

    if (!template.accountId) {
      throw new ConflictError('Template must have an account set before generating a transaction');
    }

    const today = new Date();
    const tmpl = template as typeof template & {
      fundGroupId?: string | null;
      fundGroupFlow?: string | null;
    };

    const tx = await RecurringTemplatesRepository.createTransaction({
      user: { connect: { id: userId } },
      date: today,
      budgetPeriodYear: today.getFullYear(),
      budgetPeriodMonth: today.getMonth() + 1,
      type: template.type as never,
      amount: template.estimatedAmount,
      currency: 'INR',
      account: { connect: { id: template.accountId } },
      ...(template.toAccountId && { toAccount: { connect: { id: template.toAccountId } } }),
      ...(template.categoryId && { category: { connect: { id: template.categoryId } } }),
      paymentMethod: 'AUTO_DEBIT' as never,
      isPlanned: true,
      isRecurring: true,
      status: 'PENDING' as never,
      recurringTemplate: { connect: { id } },
      merchant: template.name,
      tags: template.tags,
      ...(tmpl.fundGroupId && {
        fundGroupId: tmpl.fundGroupId,
        fundGroupFlow: tmpl.fundGroupFlow as never,
      }),
    });

    await RecurringTemplatesRepository.updateLastGenerated(id);
    return { transactionId: tx.id, transaction: tx };
  },
};
