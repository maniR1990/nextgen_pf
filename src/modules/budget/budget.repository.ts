// Legacy BudgetLine model has been replaced by the Budget model in budget-engine.
// This stub prevents compile errors while old /api/budget routes remain.
import type { BudgetLineRecord } from './budget.types';

export const BudgetRepository = {
  findByUserId: (_userId: string): Promise<BudgetLineRecord[]> => Promise.resolve([]),
  findById: (_id: string): Promise<BudgetLineRecord | null> => Promise.resolve(null),
  findChildrenIds: (_userId: string, _parentId: string): Promise<string[]> => Promise.resolve([]),
  findDescendantIds: (_userId: string, _rootId: string): Promise<string[]> => Promise.resolve([]),
  create: (_data: unknown): Promise<BudgetLineRecord> =>
    Promise.reject(new Error('BudgetLine is deprecated')),
  update: (_id: string, _data: unknown): Promise<BudgetLineRecord> =>
    Promise.reject(new Error('BudgetLine is deprecated')),
  deleteMany: (_ids: string[]): Promise<{ count: number }> => Promise.resolve({ count: 0 }),
};
