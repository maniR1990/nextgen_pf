import { ConflictError, NotFoundError } from '@/lib/api/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecurringTemplatesRepository } from './recurring-templates.repository';
import { computeOccurrences, RecurringTemplatesService } from './recurring-templates.service';

vi.mock('./recurring-templates.repository');

const mockTemplate = {
  id: 'rt1',
  userId: 'u1',
  name: 'HDFC SIP',
  type: 'INVESTMENT',
  frequency: 'MONTHLY',
  dayOfMonth: 5,
  secondDayOfMonth: null,
  estimatedAmount: 5000,
  isActive: true,
  accountId: 'acc1',
  toAccountId: null,
  categoryId: null,
  months: [],
  tags: [],
  createdAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('RecurringTemplatesService.list', () => {
  it('returns templates for the user', async () => {
    vi.mocked(RecurringTemplatesRepository.findByUserId).mockResolvedValue([mockTemplate] as never);
    const result = await RecurringTemplatesService.list('u1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('rt1');
  });
});

describe('RecurringTemplatesService.create', () => {
  it('creates a new template', async () => {
    vi.mocked(RecurringTemplatesRepository.create).mockResolvedValue(mockTemplate as never);
    const result = await RecurringTemplatesService.create('u1', {
      name: 'HDFC SIP',
      type: 'INVESTMENT',
      frequency: 'MONTHLY',
      dayOfMonth: 5,
      estimatedAmount: 5000,
    });
    expect(result.name).toBe('HDFC SIP');
  });
});

describe('RecurringTemplatesService.update', () => {
  it('pauses an active template', async () => {
    vi.mocked(RecurringTemplatesRepository.findById).mockResolvedValue(mockTemplate as never);
    vi.mocked(RecurringTemplatesRepository.update).mockResolvedValue({
      ...mockTemplate,
      isActive: false,
    } as never);
    const result = await RecurringTemplatesService.update('rt1', 'u1', { isActive: false });
    expect(result.isActive).toBe(false);
  });

  it('throws NotFoundError when template belongs to another user', async () => {
    vi.mocked(RecurringTemplatesRepository.findById).mockResolvedValue({
      ...mockTemplate,
      userId: 'other',
    } as never);
    await expect(RecurringTemplatesService.update('rt1', 'u1', {})).rejects.toThrow(NotFoundError);
  });
});

describe('RecurringTemplatesService.previewOccurrences', () => {
  it('returns N future dates for MONTHLY frequency', async () => {
    vi.mocked(RecurringTemplatesRepository.findById).mockResolvedValue(mockTemplate as never);
    const result = await RecurringTemplatesService.previewOccurrences('rt1', 'u1', 3);
    expect(result.occurrences).toHaveLength(3);
    result.occurrences.forEach((o) => {
      expect(o.date).toBeInstanceOf(Date);
      expect(o.date.getTime()).toBeGreaterThan(Date.now());
      expect(o.estimatedAmount).toBe(5000);
    });
  });

  it('returns dates on the 5th of future months', async () => {
    vi.mocked(RecurringTemplatesRepository.findById).mockResolvedValue(mockTemplate as never);
    const result = await RecurringTemplatesService.previewOccurrences('rt1', 'u1', 2);
    result.occurrences.forEach((o) => {
      expect(o.date.getDate()).toBe(5);
    });
  });

  it('handles TWICE_MONTHLY with two dates per month', async () => {
    const twiceMonthly = {
      ...mockTemplate,
      frequency: 'TWICE_MONTHLY',
      dayOfMonth: 1,
      secondDayOfMonth: 15,
    };
    vi.mocked(RecurringTemplatesRepository.findById).mockResolvedValue(twiceMonthly as never);
    const result = await RecurringTemplatesService.previewOccurrences('rt1', 'u1', 4);
    expect(result.occurrences).toHaveLength(4);
    result.occurrences.forEach((o) => {
      expect(o.date.getTime()).toBeGreaterThan(Date.now());
    });
  });
});

describe('computeOccurrences — honors explicit due months', () => {
  const reference = new Date(2026, 2, 15); // March 15, 2026

  it('lands only on the configured months for HALF_YEARLY, not every 6 months from today', () => {
    const dates = computeOccurrences(
      { frequency: 'HALF_YEARLY', dayOfMonth: 10, months: [1, 7] },
      2,
      reference,
    );
    // Jan 10 already passed this year, so next is Jul 10 2026, then Jan 10 2027 —
    // NOT Sep 15 2026 (which is what "6 months from March 15" would wrongly produce).
    expect(dates[0]).toEqual(new Date(2026, 6, 10));
    expect(dates[1]).toEqual(new Date(2027, 0, 10));
  });

  it('lands on all configured months for QUARTERLY across a year boundary', () => {
    const dates = computeOccurrences(
      { frequency: 'QUARTERLY', dayOfMonth: 1, months: [1, 4, 7, 10] },
      5,
      reference,
    );
    expect(dates.map((d) => d.getMonth())).toEqual([3, 6, 9, 0, 3]);
    expect(dates[3].getFullYear()).toBe(2027);
  });

  it('falls back to fixed-interval-from-now when no due months are configured yet', () => {
    const dates = computeOccurrences(
      { frequency: 'ANNUAL', dayOfMonth: 10, months: [] },
      1,
      reference,
    );
    // Legacy behavior preserved for templates created before due-month selection existed.
    expect(dates[0]).toEqual(new Date(2027, 2, 10));
  });

  it('ignores months for MONTHLY frequency — every month is due regardless', () => {
    const dates = computeOccurrences(
      { frequency: 'MONTHLY', dayOfMonth: 10, months: [1] },
      2,
      reference,
    );
    // March 10 has already passed relative to the March 15 reference date.
    expect(dates[0]).toEqual(new Date(2026, 3, 10));
    expect(dates[1]).toEqual(new Date(2026, 4, 10));
  });
});

describe('RecurringTemplatesService.create — fund group tagging', () => {
  it('stores fundGroupId and fundGroupFlow when provided', async () => {
    const created = {
      ...mockTemplate,
      type: 'TRANSFER',
      toAccountId: 'acc2',
      fundGroupId: 'fg1',
      fundGroupFlow: 'IN',
    };
    vi.mocked(RecurringTemplatesRepository.create).mockResolvedValue(created as never);

    const result = await RecurringTemplatesService.create('u1', {
      name: 'Monthly SIP',
      type: 'TRANSFER',
      frequency: 'MONTHLY',
      dayOfMonth: 5,
      estimatedAmount: 10000,
      toAccountId: 'acc2',
      fundGroupId: 'fg1',
      fundGroupFlow: 'IN',
    });

    expect(RecurringTemplatesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ fundGroupId: 'fg1', fundGroupFlow: 'IN' }),
    );
    expect(result.fundGroupId).toBe('fg1');
    expect(result.fundGroupFlow).toBe('IN');
  });

  it('creates template without fundGroupId when not provided', async () => {
    vi.mocked(RecurringTemplatesRepository.create).mockResolvedValue(mockTemplate as never);

    await RecurringTemplatesService.create('u1', {
      name: 'HDFC SIP',
      type: 'INVESTMENT',
      frequency: 'MONTHLY',
      dayOfMonth: 5,
      estimatedAmount: 5000,
    });

    const call = vi.mocked(RecurringTemplatesRepository.create).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(call).not.toHaveProperty('fundGroupId');
  });
});

describe('RecurringTemplatesService.generate', () => {
  it('creates a FinanceTransaction from the template', async () => {
    vi.mocked(RecurringTemplatesRepository.findById).mockResolvedValue(mockTemplate as never);
    vi.mocked(RecurringTemplatesRepository.createTransaction).mockResolvedValue({
      id: 'tx_gen1',
    } as never);
    vi.mocked(RecurringTemplatesRepository.updateLastGenerated).mockResolvedValue(
      mockTemplate as never,
    );
    const result = await RecurringTemplatesService.generate('rt1', 'u1');
    expect(result.transactionId).toBe('tx_gen1');
  });

  it('throws ConflictError when template has no account set', async () => {
    vi.mocked(RecurringTemplatesRepository.findById).mockResolvedValue({
      ...mockTemplate,
      accountId: null,
    } as never);
    await expect(RecurringTemplatesService.generate('rt1', 'u1')).rejects.toThrow(ConflictError);
  });

  it('throws NotFoundError when template belongs to another user', async () => {
    vi.mocked(RecurringTemplatesRepository.findById).mockResolvedValue({
      ...mockTemplate,
      userId: 'other',
    } as never);
    await expect(RecurringTemplatesService.generate('rt1', 'u1')).rejects.toThrow(NotFoundError);
  });
});

describe('RecurringTemplatesService.generate — fund tag propagation', () => {
  it('generated transaction inherits fundGroupId + fundGroupFlow from template', async () => {
    const taggedTemplate = {
      ...mockTemplate,
      type: 'TRANSFER',
      toAccountId: 'acc2',
      fundGroupId: 'fg1',
      fundGroupFlow: 'IN',
    };
    vi.mocked(RecurringTemplatesRepository.findById).mockResolvedValue(taggedTemplate as never);
    vi.mocked(RecurringTemplatesRepository.createTransaction).mockResolvedValue({
      id: 'tx_gen2',
    } as never);
    vi.mocked(RecurringTemplatesRepository.updateLastGenerated).mockResolvedValue(
      taggedTemplate as never,
    );

    await RecurringTemplatesService.generate('rt1', 'u1');

    expect(RecurringTemplatesRepository.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ fundGroupId: 'fg1', fundGroupFlow: 'IN' }),
    );
  });

  it('generated transaction has no fundGroupId when template is untagged', async () => {
    vi.mocked(RecurringTemplatesRepository.findById).mockResolvedValue(mockTemplate as never);
    vi.mocked(RecurringTemplatesRepository.createTransaction).mockResolvedValue({
      id: 'tx_gen3',
    } as never);
    vi.mocked(RecurringTemplatesRepository.updateLastGenerated).mockResolvedValue(
      mockTemplate as never,
    );

    await RecurringTemplatesService.generate('rt1', 'u1');

    const call = vi.mocked(RecurringTemplatesRepository.createTransaction).mock
      .calls[0][0] as Record<string, unknown>;
    expect(call.fundGroupId).toBeUndefined();
  });
});
