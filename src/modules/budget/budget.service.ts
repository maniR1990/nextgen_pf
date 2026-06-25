import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/api/errors';
import { BudgetRepository } from './budget.repository';
import { buildBudgetLedgerPayload, withRollupMetrics } from './budget.tree';
import type {
  BudgetLedgerPayload,
  BudgetLineRecord,
  CreateBudgetLineDto,
  UpdateBudgetLineDto,
} from './budget.types';

async function assertOwnership(userId: string, lineId: string): Promise<BudgetLineRecord> {
  const line = await BudgetRepository.findById(lineId);
  if (!line) throw new NotFoundError('Budget line not found');
  if (line.userId !== userId) throw new ForbiddenError();
  return line;
}

async function assertParent(userId: string, parentId: string | null | undefined) {
  if (!parentId) return;
  const parent = await assertOwnership(userId, parentId);
  if (parent.kind === 'LINE') {
    throw new ValidationError('Cannot nest under a line item');
  }
}

export const BudgetService = {
  async getLedger(userId: string): Promise<BudgetLedgerPayload> {
    const flat = await BudgetRepository.findByUserId(userId);
    const payload = buildBudgetLedgerPayload(flat);
    return {
      rows: payload.rows.map(withRollupMetrics),
      summaries: payload.summaries,
    };
  },

  async createLine(userId: string, dto: CreateBudgetLineDto) {
    await assertParent(userId, dto.parentId ?? null);

    const line = await BudgetRepository.create({
      title: dto.title,
      kind: dto.kind,
      variant: dto.variant ?? null,
      plannedMinor: dto.plannedMinor ?? 0,
      spentMinor: dto.spentMinor ?? 0,
      sortOrder: dto.sortOrder ?? 0,
      tag: dto.tag ?? null,
      note: dto.note ?? null,
      typeLabel: dto.typeLabel ?? null,
      parentId: dto.parentId ?? null,
      user: { connect: { id: userId } },
    });

    return line;
  },

  async updateLine(userId: string, id: string, dto: UpdateBudgetLineDto) {
    await assertOwnership(userId, id);
    return BudgetRepository.update(id, dto);
  },

  async deleteLine(userId: string, id: string) {
    await assertOwnership(userId, id);
    const descendantIds = await BudgetRepository.findDescendantIds(userId, id);
    await BudgetRepository.deleteMany([id, ...descendantIds]);
  },
};
