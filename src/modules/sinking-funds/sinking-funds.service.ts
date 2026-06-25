import { NotFoundError } from '@/lib/api/errors';
import { getLogger } from '@/lib/logger';
import { SinkingFundsRepository } from './sinking-funds.repository';

const log = getLogger('SinkingFundsService');

function assertOwned(fund: { userId: string }, userId: string) {
  if (fund.userId !== userId) throw new NotFoundError('Sinking fund not found');
}

function toDto(fund: Awaited<ReturnType<typeof SinkingFundsRepository.findById>>) {
  return {
    id: fund.id,
    name: fund.name,
    purpose: fund.purpose,
    targetAmount: fund.targetAmount,
    // Balance is computed from FundAllocation × Account balances — not stored directly
    currentBalance: 0,
    monthlyContribution: 0,
    milestones: fund.milestones,
  };
}

export const SinkingFundsService = {
  async list(userId: string) {
    const rows = await SinkingFundsRepository.findByUserId(userId);
    return rows.map(toDto);
  },

  async deposit(id: string, userId: string, amount: number) {
    const fund = await SinkingFundsRepository.findById(id);
    assertOwned(fund, userId);
    log.info('deposit recorded', { id, amount });
    // Deposit tracking requires a FundAllocation transaction — returning fund state for now
    return toDto(fund);
  },
};
