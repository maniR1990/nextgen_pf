import {
  ConflictError,
  NotFoundError,
  ProjectActivityItemNotFoundError,
  ProjectForecastLineNotFoundError,
  ProjectNotFoundError,
  ProjectVendorHasTransactionsError,
  ProjectVendorMismatchError,
  ProjectVendorNotFoundError,
  ValidationError,
} from '@/lib/api/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

vi.mock('./projects.repository');

const userId = 'u1';

const mockProject = {
  id: 'p1',
  userId,
  name: 'Home renovation',
  description: null,
  status: 'PLANNING' as const,
  startDate: null,
  targetCompletionDate: null,
  completedAt: null,
  notes: null,
  fundingAccountId: null as string | null,
  fundingFundId: null as string | null,
  forecastLines: [] as {
    id: string;
    description: string;
    forecastAmount: number;
    createdAt: Date;
  }[],
  vendors: [] as {
    id: string;
    name: string;
    contractAmount: number;
    notes: string | null;
    createdAt: Date;
  }[],
  todos: [] as { id: string; text: string; done: boolean; createdAt: Date }[],
  activityNotes: [] as {
    id: string;
    text: string;
    tag: string;
    date: Date;
    returnOfTransactionId: string | null;
    createdAt: Date;
  }[],
  references: [] as {
    id: string;
    key: string;
    value: string;
    vendorId: string | null;
    createdAt: Date;
  }[],
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  // Defaults for the tests that don't care about these — no lines, no spend, no vendors.
  vi.mocked(ProjectsRepository.sumActualByForecastLine).mockResolvedValue([]);
  vi.mocked(ProjectsRepository.sumTotalByProject).mockResolvedValue({
    _sum: { amount: null },
  } as never);
  vi.mocked(ProjectsRepository.sumPaymentsByVendor).mockResolvedValue([]);
  vi.mocked(ProjectsRepository.sumByPlannedFlag).mockResolvedValue([]);
});

describe('ProjectsService.list', () => {
  beforeEach(() => {
    vi.mocked(ProjectsRepository.findAccountsByIds).mockResolvedValue([]);
    vi.mocked(ProjectsRepository.findFundsByIds).mockResolvedValue([]);
  });

  it('resolves the funding label for each project and returns pagination meta', async () => {
    vi.mocked(ProjectsRepository.findMany).mockResolvedValue([
      { ...mockProject, fundingAccountId: 'a1' },
    ] as never);
    vi.mocked(ProjectsRepository.countMany).mockResolvedValue(1);
    vi.mocked(ProjectsRepository.findAccountsByIds).mockResolvedValue([
      { id: 'a1', name: 'Savings' },
    ] as never);

    const { data, meta } = await ProjectsService.list(userId, { page: 1, limit: 20 });
    expect(data[0].fundingLabel).toBe('Savings');
    expect(meta.total).toBe(1);
  });

  it('returns a null funding label when nothing is set', async () => {
    vi.mocked(ProjectsRepository.findMany).mockResolvedValue([mockProject] as never);
    vi.mocked(ProjectsRepository.countMany).mockResolvedValue(1);

    const { data } = await ProjectsService.list(userId, {});
    expect(data[0].fundingLabel).toBeNull();
  });

  // The whole point of batching: no matter how many projects come back, funding
  // labels resolve via one findAccountsByIds + one findFundsByIds call, not one
  // query per project (the N+1 this replaced).
  it('batches funding lookups into a single call per type regardless of project count', async () => {
    vi.mocked(ProjectsRepository.findMany).mockResolvedValue([
      { ...mockProject, id: 'p1', fundingAccountId: 'a1' },
      { ...mockProject, id: 'p2', fundingAccountId: 'a2' },
      { ...mockProject, id: 'p3', fundingFundId: 'f1' },
      { ...mockProject, id: 'p4' },
    ] as never);
    vi.mocked(ProjectsRepository.countMany).mockResolvedValue(4);
    vi.mocked(ProjectsRepository.findAccountsByIds).mockResolvedValue([
      { id: 'a1', name: 'Savings' },
      { id: 'a2', name: 'Checking' },
    ] as never);
    vi.mocked(ProjectsRepository.findFundsByIds).mockResolvedValue([
      { id: 'f1', name: 'Emergency Fund' },
    ] as never);

    const { data } = await ProjectsService.list(userId, { page: 1, limit: 20 });

    expect(ProjectsRepository.findAccountsByIds).toHaveBeenCalledTimes(1);
    expect(ProjectsRepository.findFundsByIds).toHaveBeenCalledTimes(1);
    expect(vi.mocked(ProjectsRepository.findAccountsByIds).mock.calls[0][1]).toEqual(
      expect.arrayContaining(['a1', 'a2']),
    );
    expect(vi.mocked(ProjectsRepository.findFundsByIds).mock.calls[0][1]).toEqual(['f1']);

    expect(data.find((p) => p.id === 'p1')?.fundingLabel).toBe('Savings');
    expect(data.find((p) => p.id === 'p2')?.fundingLabel).toBe('Checking');
    expect(data.find((p) => p.id === 'p3')?.fundingLabel).toBe('Emergency Fund');
    expect(data.find((p) => p.id === 'p4')?.fundingLabel).toBeNull();
  });
});

describe('ProjectsService.create', () => {
  it('rejects an unknown funding account', async () => {
    vi.mocked(ProjectsRepository.findAccountById).mockResolvedValue(null);
    await expect(
      ProjectsService.create(userId, { name: 'Reno', fundingAccountId: 'bad' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('creates a project scoped to the requesting user', async () => {
    vi.mocked(ProjectsRepository.create).mockResolvedValue(mockProject);
    const result = await ProjectsService.create(userId, { name: 'Home renovation' });
    expect(result.name).toBe('Home renovation');
    expect(ProjectsRepository.create).toHaveBeenCalled();
  });

  it('passes initial forecast lines through to the repository create call', async () => {
    vi.mocked(ProjectsRepository.create).mockResolvedValue({
      ...mockProject,
      forecastLines: [
        {
          id: 'l1',
          description: 'Tiling',
          forecastAmount: 80000,
          createdAt: new Date(),
        },
      ],
    });

    const result = await ProjectsService.create(userId, {
      name: 'Reno',
      forecastLines: [{ description: 'Tiling', forecastAmount: 80000 }],
    });

    const [createArg] = vi.mocked(ProjectsRepository.create).mock.calls[0];
    const forecastLines = (createArg as { forecastLines: { description: string }[] }).forecastLines;
    expect(forecastLines).toHaveLength(1);
    expect(forecastLines[0].description).toBe('Tiling');
    expect(result.forecastLines[0].description).toBe('Tiling');
  });
});

describe('ProjectsService.get', () => {
  it('throws ProjectNotFoundError when the project belongs to another user', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue({ ...mockProject, userId: 'other' });
    await expect(ProjectsService.get('p1', userId)).rejects.toThrow(ProjectNotFoundError);
  });

  it('returns the project when owned by the requester', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    const result = await ProjectsService.get('p1', userId);
    expect(result.id).toBe('p1');
  });
});

describe('ProjectsService.update', () => {
  it('rejects an unknown funding fund', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    vi.mocked(ProjectsRepository.findFundById).mockResolvedValue(null);
    await expect(ProjectsService.update('p1', userId, { fundingFundId: 'bad' })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('allows a PLANNING to ACTIVE status transition', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({ ...mockProject, status: 'ACTIVE' });
    const result = await ProjectsService.update('p1', userId, { status: 'ACTIVE' });
    expect(result.status).toBe('ACTIVE');
  });

  it('throws ProjectNotFoundError when updating another user’s project', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue({ ...mockProject, userId: 'other' });
    await expect(ProjectsService.update('p1', userId, { name: 'x' })).rejects.toThrow(
      ProjectNotFoundError,
    );
  });
});

describe('ProjectsService.hardDelete', () => {
  it('deletes a project owned by the requester', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    await ProjectsService.hardDelete('p1', userId);
    expect(ProjectsRepository.hardDelete).toHaveBeenCalledWith('p1');
  });

  it('throws ProjectNotFoundError for a project owned by another user', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue({ ...mockProject, userId: 'other' });
    await expect(ProjectsService.hardDelete('p1', userId)).rejects.toThrow(ProjectNotFoundError);
  });
});

describe('ProjectsService.addForecastLine', () => {
  it('adds a forecast line and returns it in the summary', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({
      ...mockProject,
      forecastLines: [
        {
          id: 'line1',
          description: 'Tiling',
          forecastAmount: 80000,
          createdAt: new Date(),
        },
      ],
    });

    const result = await ProjectsService.addForecastLine('p1', userId, {
      description: 'Tiling',
      forecastAmount: 80000,
    });

    const [, data] = vi.mocked(ProjectsRepository.update).mock.calls[0];
    const forecastLines = (data as { forecastLines: { description: string }[] }).forecastLines;
    expect(forecastLines[0].description).toBe('Tiling');
    expect(result.forecastLines[0].description).toBe('Tiling');
  });

  it('rejects a vendorId that does not belong to the project', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    await expect(
      ProjectsService.addForecastLine('p1', userId, {
        description: 'Tiling',
        forecastAmount: 80000,
        vendorId: 'not-a-real-vendor',
      }),
    ).rejects.toThrow(ProjectVendorMismatchError);
  });

  it('accepts a valid vendorId and resolves vendorLabel on the returned summary', async () => {
    const withVendor = {
      ...mockProject,
      vendors: [
        {
          id: 'v1',
          name: 'Sharma Interiors',
          contractAmount: 450000,
          notes: null,
          createdAt: new Date(),
        },
      ],
    };
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(withVendor);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({
      ...withVendor,
      forecastLines: [
        {
          id: 'line1',
          description: 'Flooring',
          forecastAmount: 100000,
          vendorId: 'v1',
          createdAt: new Date(),
        },
      ],
    });

    const result = await ProjectsService.addForecastLine('p1', userId, {
      description: 'Flooring',
      forecastAmount: 100000,
      vendorId: 'v1',
    });

    const [, data] = vi.mocked(ProjectsRepository.update).mock.calls[0];
    const forecastLines = (data as { forecastLines: { vendorId: string | null }[] }).forecastLines;
    expect(forecastLines[0].vendorId).toBe('v1');
    expect(result.forecastLines[0].vendorLabel).toBe('Sharma Interiors');
  });
});

describe('ProjectsService.updateForecastLine', () => {
  it('throws ProjectForecastLineNotFoundError when the line does not exist', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    await expect(
      ProjectsService.updateForecastLine('p1', 'missing', userId, { forecastAmount: 1 }),
    ).rejects.toThrow(ProjectForecastLineNotFoundError);
  });

  it('updates the matching line only', async () => {
    const withLines = {
      ...mockProject,
      forecastLines: [
        {
          id: 'line1',
          description: 'Tiling',
          forecastAmount: 80000,
          createdAt: new Date(),
        },
      ],
    };
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(withLines);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({
      ...withLines,
      forecastLines: [{ ...withLines.forecastLines[0], forecastAmount: 90000 }],
    });

    await ProjectsService.updateForecastLine('p1', 'line1', userId, { forecastAmount: 90000 });

    const [, data] = vi.mocked(ProjectsRepository.update).mock.calls[0];
    const lines = (data as { forecastLines: { forecastAmount: number }[] }).forecastLines;
    expect(lines[0].forecastAmount).toBe(90000);
  });

  it('rejects a vendorId that does not belong to the project', async () => {
    const withLines = {
      ...mockProject,
      forecastLines: [
        { id: 'line1', description: 'Tiling', forecastAmount: 80000, createdAt: new Date() },
      ],
    };
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(withLines);
    await expect(
      ProjectsService.updateForecastLine('p1', 'line1', userId, { vendorId: 'not-a-real-vendor' }),
    ).rejects.toThrow(ProjectVendorMismatchError);
  });

  it('clears vendorId when sent as an empty string', async () => {
    const withLines = {
      ...mockProject,
      vendors: [
        {
          id: 'v1',
          name: 'Sharma Interiors',
          contractAmount: 450000,
          notes: null,
          createdAt: new Date(),
        },
      ],
      forecastLines: [
        {
          id: 'line1',
          description: 'Flooring',
          forecastAmount: 80000,
          vendorId: 'v1',
          createdAt: new Date(),
        },
      ],
    };
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(withLines);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({
      ...withLines,
      forecastLines: [{ ...withLines.forecastLines[0], vendorId: null }],
    });

    await ProjectsService.updateForecastLine('p1', 'line1', userId, { vendorId: '' });

    const [, data] = vi.mocked(ProjectsRepository.update).mock.calls[0];
    const lines = (data as { forecastLines: { vendorId: string | null }[] }).forecastLines;
    expect(lines[0].vendorId).toBeNull();
  });
});

describe('ProjectsService.removeForecastLine', () => {
  it('throws ProjectForecastLineNotFoundError when the line does not exist', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    await expect(ProjectsService.removeForecastLine('p1', 'missing', userId)).rejects.toThrow(
      ProjectForecastLineNotFoundError,
    );
  });

  it('removes the matching line', async () => {
    const withLines = {
      ...mockProject,
      forecastLines: [
        {
          id: 'line1',
          description: 'Tiling',
          forecastAmount: 80000,
          createdAt: new Date(),
        },
      ],
    };
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(withLines);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({ ...withLines, forecastLines: [] });

    await ProjectsService.removeForecastLine('p1', 'line1', userId);

    const [, data] = vi.mocked(ProjectsRepository.update).mock.calls[0];
    expect((data as { forecastLines: unknown[] }).forecastLines).toEqual([]);
  });
});

describe('ProjectsService forecastTotal', () => {
  it('sums forecastAmount across all lines', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue({
      ...mockProject,
      forecastLines: [
        {
          id: 'l1',
          description: 'Tiling',
          forecastAmount: 80000,
          createdAt: new Date(),
        },
        {
          id: 'l2',
          description: 'Electrical',
          forecastAmount: 50000,
          createdAt: new Date(),
        },
      ],
    });

    const result = await ProjectsService.get('p1', userId);
    expect(result.forecastTotal).toBe(130000);
    expect(result.forecastLines[0].description).toBe('Tiling');
    expect(result.forecastLines[0].actualAmount).toBe(0);
  });

  it('resolves actualAmount per line and spentTotal for the whole project', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue({
      ...mockProject,
      forecastLines: [
        {
          id: 'l1',
          description: 'Tiling',
          forecastAmount: 80000,
          createdAt: new Date(),
        },
      ],
    });
    vi.mocked(ProjectsRepository.sumActualByForecastLine).mockResolvedValue([
      { projectForecastLineId: 'l1', _sum: { amount: 48000 } },
    ] as never);
    // spentTotal includes an unplanned ₹5,000 not tied to any forecast line —
    // must reflect real total spend, not just the sum of matched line actuals.
    vi.mocked(ProjectsRepository.sumTotalByProject).mockResolvedValue({
      _sum: { amount: 53000 },
    } as never);

    const result = await ProjectsService.get('p1', userId);
    expect(result.forecastLines[0].actualAmount).toBe(48000);
    expect(result.spentTotal).toBe(53000);
  });
});

describe('ProjectsService.addVendor', () => {
  it('adds a vendor with balance equal to the full contract amount', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({
      ...mockProject,
      vendors: [
        {
          id: 'v1',
          name: 'Sharma Interiors',
          contractAmount: 450000,
          notes: null,
          createdAt: new Date(),
        },
      ],
    });

    const result = await ProjectsService.addVendor('p1', userId, {
      name: 'Sharma Interiors',
      contractAmount: 450000,
    });

    expect(result.vendors[0].balance).toBe(450000);
  });
});

describe('ProjectsService vendor balance', () => {
  it('is contractAmount minus non-refund payments, ignoring refunds', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue({
      ...mockProject,
      vendors: [
        {
          id: 'v1',
          name: 'Sharma Interiors',
          contractAmount: 450000,
          notes: null,
          createdAt: new Date(),
        },
      ],
    });
    // Advance 100000 + milestone 48000 count; a 5000 refund is excluded entirely,
    // not subtracted — see plan doc "cut #1".
    vi.mocked(ProjectsRepository.sumPaymentsByVendor).mockResolvedValue([
      { projectVendorId: 'v1', _sum: { amount: 148000 } },
    ] as never);

    const result = await ProjectsService.get('p1', userId);
    expect(result.vendors[0].balance).toBe(450000 - 148000);
  });
});

describe('ProjectsService.updateVendor', () => {
  it('throws ProjectVendorNotFoundError when the vendor does not exist', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    await expect(
      ProjectsService.updateVendor('p1', 'missing', userId, { name: 'x' }),
    ).rejects.toThrow(ProjectVendorNotFoundError);
  });

  it('updates the matching vendor only', async () => {
    const withVendor = {
      ...mockProject,
      vendors: [
        {
          id: 'v1',
          name: 'Sharma Interiors',
          contractAmount: 450000,
          notes: null,
          createdAt: new Date(),
        },
      ],
    };
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(withVendor);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({
      ...withVendor,
      vendors: [{ ...withVendor.vendors[0], contractAmount: 500000 }],
    });

    await ProjectsService.updateVendor('p1', 'v1', userId, { contractAmount: 500000 });

    const [, data] = vi.mocked(ProjectsRepository.update).mock.calls[0];
    const vendors = (data as { vendors: { contractAmount: number }[] }).vendors;
    expect(vendors[0].contractAmount).toBe(500000);
  });
});

describe('ProjectsService.removeVendor', () => {
  it('throws ProjectVendorNotFoundError when the vendor does not exist', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    await expect(ProjectsService.removeVendor('p1', 'missing', userId)).rejects.toThrow(
      ProjectVendorNotFoundError,
    );
  });

  it('blocks deletion when the vendor has logged transactions', async () => {
    const withVendor = {
      ...mockProject,
      vendors: [
        {
          id: 'v1',
          name: 'Sharma Interiors',
          contractAmount: 450000,
          notes: null,
          createdAt: new Date(),
        },
      ],
    };
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(withVendor);
    vi.mocked(ProjectsRepository.countTransactionsByVendor).mockResolvedValue(2);

    await expect(ProjectsService.removeVendor('p1', 'v1', userId)).rejects.toThrow(
      ProjectVendorHasTransactionsError,
    );
  });

  it('removes the vendor when it has no logged transactions', async () => {
    const withVendor = {
      ...mockProject,
      vendors: [
        {
          id: 'v1',
          name: 'Sharma Interiors',
          contractAmount: 450000,
          notes: null,
          createdAt: new Date(),
        },
      ],
    };
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(withVendor);
    vi.mocked(ProjectsRepository.countTransactionsByVendor).mockResolvedValue(0);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({ ...withVendor, vendors: [] });

    await ProjectsService.removeVendor('p1', 'v1', userId);

    const [, data] = vi.mocked(ProjectsRepository.update).mock.calls[0];
    expect((data as { vendors: unknown[] }).vendors).toEqual([]);
  });

  it('un-links, rather than orphans, any forecast line pointing at the removed vendor', async () => {
    const withVendorAndLine = {
      ...mockProject,
      vendors: [
        {
          id: 'v1',
          name: 'Sharma Interiors',
          contractAmount: 450000,
          notes: null,
          createdAt: new Date(),
        },
      ],
      forecastLines: [
        {
          id: 'line1',
          description: 'Flooring',
          forecastAmount: 100000,
          vendorId: 'v1',
          createdAt: new Date(),
        },
      ],
    };
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(withVendorAndLine);
    vi.mocked(ProjectsRepository.countTransactionsByVendor).mockResolvedValue(0);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({
      ...withVendorAndLine,
      vendors: [],
      forecastLines: [{ ...withVendorAndLine.forecastLines[0], vendorId: null }],
    });

    await ProjectsService.removeVendor('p1', 'v1', userId);

    const [, data] = vi.mocked(ProjectsRepository.update).mock.calls[0];
    const lines = (data as { forecastLines: { vendorId: string | null }[] }).forecastLines;
    expect(lines[0].vendorId).toBeNull();
  });
});

describe('ProjectsService.addActivityItem', () => {
  it('adds a todo defaulting to done=false', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({
      ...mockProject,
      todos: [{ id: 't1', text: 'Choose bathroom tiles', done: false, createdAt: new Date() }],
    });

    const result = await ProjectsService.addActivityItem('p1', userId, {
      kind: 'todo',
      text: 'Choose bathroom tiles',
    });

    expect(result.todos[0].done).toBe(false);
  });

  it('adds a return-tagged note carrying returnOfTransactionId', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({
      ...mockProject,
      activityNotes: [
        {
          id: 'n1',
          text: 'Returned defective tiles',
          tag: 'RETURN',
          date: new Date(),
          returnOfTransactionId: 'tx1',
          createdAt: new Date(),
        },
      ],
    });

    await ProjectsService.addActivityItem('p1', userId, {
      kind: 'note',
      text: 'Returned defective tiles',
      tag: 'RETURN' as never,
      returnOfTransactionId: 'tx1',
    });

    const [, data] = vi.mocked(ProjectsRepository.update).mock.calls[0];
    const notes = (data as { activityNotes: { returnOfTransactionId: string | null }[] })
      .activityNotes;
    expect(notes[0].returnOfTransactionId).toBe('tx1');
  });

  it('rejects a reference pointing at a vendor not on this project', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    await expect(
      ProjectsService.addActivityItem('p1', userId, {
        kind: 'reference',
        key: 'Site supervisor',
        value: 'Ramesh, 98765xxxxx',
        vendorId: 'not-a-real-vendor',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('adds a reference with a valid vendor link', async () => {
    const withVendor = {
      ...mockProject,
      vendors: [
        {
          id: 'v1',
          name: 'Sharma Interiors',
          contractAmount: 450000,
          notes: null,
          createdAt: new Date(),
        },
      ],
    };
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(withVendor);
    vi.mocked(ProjectsRepository.sumPaymentsByVendor).mockResolvedValue([]);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({
      ...withVendor,
      references: [
        {
          id: 'r1',
          key: 'Site supervisor',
          value: 'Ramesh',
          vendorId: 'v1',
          createdAt: new Date(),
        },
      ],
    });

    const result = await ProjectsService.addActivityItem('p1', userId, {
      kind: 'reference',
      key: 'Site supervisor',
      value: 'Ramesh',
      vendorId: 'v1',
    });

    expect(result.references[0].vendorLabel).toBe('Sharma Interiors');
  });
});

describe('ProjectsService.updateActivityItem', () => {
  it('toggles a todo done', async () => {
    const withTodo = {
      ...mockProject,
      todos: [{ id: 't1', text: 'Choose bathroom tiles', done: false, createdAt: new Date() }],
    };
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(withTodo);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({
      ...withTodo,
      todos: [{ ...withTodo.todos[0], done: true }],
    });

    const result = await ProjectsService.updateActivityItem('p1', 't1', userId, { done: true });
    expect(result.todos[0].done).toBe(true);
  });

  it('throws ProjectActivityItemNotFoundError when the item does not exist in any list', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    await expect(
      ProjectsService.updateActivityItem('p1', 'missing', userId, { done: true }),
    ).rejects.toThrow(ProjectActivityItemNotFoundError);
  });
});

describe('ProjectsService.removeActivityItem', () => {
  it('removes a reference and leaves todos/notes untouched', async () => {
    const withItems = {
      ...mockProject,
      todos: [{ id: 't1', text: 'Choose tiles', done: false, createdAt: new Date() }],
      references: [
        { id: 'r1', key: 'Gate code', value: '4521', vendorId: null, createdAt: new Date() },
      ],
    };
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(withItems);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({ ...withItems, references: [] });

    await ProjectsService.removeActivityItem('p1', 'r1', userId);

    const [, data] = vi.mocked(ProjectsRepository.update).mock.calls[0];
    expect((data as { references: unknown[] }).references).toEqual([]);
    expect((data as { todos?: unknown[] }).todos).toBeUndefined();
  });

  it('throws ProjectActivityItemNotFoundError when the item does not exist in any list', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    await expect(ProjectsService.removeActivityItem('p1', 'missing', userId)).rejects.toThrow(
      ProjectActivityItemNotFoundError,
    );
  });
});

describe('ProjectsService.get planned/unplanned split', () => {
  it('derives plannedTotal and unplannedTotal from the isPlanned grouping', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    vi.mocked(ProjectsRepository.sumByPlannedFlag).mockResolvedValue([
      { isPlanned: true, _sum: { amount: 30000 } },
      { isPlanned: false, _sum: { amount: 5000 } },
    ] as never);

    const result = await ProjectsService.get('p1', userId);

    expect(result.plannedTotal).toBe(30000);
    expect(result.unplannedTotal).toBe(5000);
  });

  it('defaults both totals to 0 when there is no spend yet', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    vi.mocked(ProjectsRepository.sumByPlannedFlag).mockResolvedValue([]);

    const result = await ProjectsService.get('p1', userId);

    expect(result.plannedTotal).toBe(0);
    expect(result.unplannedTotal).toBe(0);
  });
});

describe('ProjectsService.close', () => {
  it('sets status to COMPLETED and stamps completedAt', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);
    vi.mocked(ProjectsRepository.update).mockResolvedValue({
      ...mockProject,
      status: 'COMPLETED',
      completedAt: new Date(),
    });

    await ProjectsService.close('p1', userId);

    const [, data] = vi.mocked(ProjectsRepository.update).mock.calls[0];
    expect((data as { status: string }).status).toBe('COMPLETED');
    expect((data as { completedAt: Date }).completedAt).toBeInstanceOf(Date);
  });

  it('throws ConflictError when the project is already closed', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue({
      ...mockProject,
      status: 'COMPLETED',
    });

    await expect(ProjectsService.close('p1', userId)).rejects.toThrow(ConflictError);
  });
});

describe('ProjectsService.reopen', () => {
  it('sets status to ACTIVE and clears completedAt', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue({
      ...mockProject,
      status: 'COMPLETED',
      completedAt: new Date(),
    });
    vi.mocked(ProjectsRepository.update).mockResolvedValue({
      ...mockProject,
      status: 'ACTIVE',
      completedAt: null,
    });

    await ProjectsService.reopen('p1', userId);

    const [, data] = vi.mocked(ProjectsRepository.update).mock.calls[0];
    expect((data as { status: string }).status).toBe('ACTIVE');
    expect((data as { completedAt: null }).completedAt).toBeNull();
  });

  it('throws ConflictError when the project is not closed', async () => {
    vi.mocked(ProjectsRepository.findById).mockResolvedValue(mockProject);

    await expect(ProjectsService.reopen('p1', userId)).rejects.toThrow(ConflictError);
  });
});
