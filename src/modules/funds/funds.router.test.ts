import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Handler } from '@/lib/api/middleware/types';
import { FundsService } from './funds.service';
import { v1ListFunds, v1CreateFund } from './funds.router';

vi.mock('./funds.service');

// Bypass JWT cookie check — inject session from ctx passed by the test caller
vi.mock('@/lib/api/middleware', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/api/middleware')>();
  return {
    ...original,
    withAuth: () => (handler: Handler) => handler,
  };
});

const SESSION_ID = 'u1';

function mockSession(id = SESSION_ID) {
  return { session: { id } };
}

function makeRequest(
  method: string,
  url: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const baseFund = {
  id: 'f1',
  name: 'HDFC savings',
  purpose: 'EMERGENCY' as const,
  groupId: null,
  groupName: null,
  groupSlug: null,
  targetAmount: 600000,
  targetMonths: null,
  currentAmount: 0,
  percentFilled: 0,
  sources: [],
  goalId: null,
  color: '#4f9cf9',
  icon: null,
  order: 0,
  archivedAt: null,
  createdAt: new Date('2026-06-21T12:05:22.052Z'),
  updatedAt: new Date('2026-06-21T12:05:22.052Z'),
};

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/funds (v1ListFunds)', () => {
  it('returns fund created via POST in the list', async () => {
    vi.mocked(FundsService.list).mockResolvedValue({
      data: [baseFund],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });

    const req = makeRequest('GET', 'http://localhost:3000/api/v1/funds?limit=100&sort=order_asc');
    const res = await v1ListFunds(req, mockSession() as never);
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].id).toBe('f1');
    expect(json.data[0].name).toBe('HDFC savings');
    expect(json.meta.total).toBe(1);
  });

  it('returns empty array when user has no funds', async () => {
    vi.mocked(FundsService.list).mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 100, total: 0, totalPages: 0 },
    });

    const req = makeRequest('GET', 'http://localhost:3000/api/v1/funds?limit=100&sort=order_asc');
    const res = await v1ListFunds(req, mockSession() as never);
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.data).toHaveLength(0);
    expect(json.meta.total).toBe(0);
  });

  it('returns fund with groupId, groupName, groupSlug populated when group is assigned', async () => {
    vi.mocked(FundsService.list).mockResolvedValue({
      data: [{ ...baseFund, groupId: 'fg1', groupName: 'Emergency', groupSlug: 'emergency' }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const req = makeRequest('GET', 'http://localhost:3000/api/v1/funds');
    const res = await v1ListFunds(req, mockSession() as never);
    const json = await res.json();

    expect(json.data[0].groupId).toBe('fg1');
    expect(json.data[0].groupName).toBe('Emergency');
    expect(json.data[0].groupSlug).toBe('emergency');
  });

  it('returns groupId/groupName/groupSlug as null for ungrouped funds', async () => {
    vi.mocked(FundsService.list).mockResolvedValue({
      data: [baseFund],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const req = makeRequest('GET', 'http://localhost:3000/api/v1/funds');
    const res = await v1ListFunds(req, mockSession() as never);
    const json = await res.json();

    expect(json.data[0].groupId).toBeNull();
    expect(json.data[0].groupName).toBeNull();
    expect(json.data[0].groupSlug).toBeNull();
  });
});

describe('POST /api/v1/funds (v1CreateFund)', () => {
  it('creates a fund and immediately reflects in the response', async () => {
    vi.mocked(FundsService.create).mockResolvedValue(baseFund);

    const req = makeRequest('POST', 'http://localhost:3000/api/v1/funds', {
      name: 'HDFC savings',
      purpose: 'EMERGENCY',
      targetAmount: 600000,
    });
    const res = await v1CreateFund(req, mockSession() as never);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.ok).toBe(true);
    expect(json.data.id).toBe('f1');
    expect(json.data.groupId).toBeNull();
    expect(json.data.groupName).toBeNull();
    expect(json.data.groupSlug).toBeNull();
  });

  it('creates a fund assigned to a group', async () => {
    const fundWithGroup = { ...baseFund, groupId: 'fg1', groupName: 'Emergency', groupSlug: 'emergency' };
    vi.mocked(FundsService.create).mockResolvedValue(fundWithGroup);

    const req = makeRequest('POST', 'http://localhost:3000/api/v1/funds', {
      name: 'Emergency Buffer',
      purpose: 'EMERGENCY',
      targetAmount: 300000,
      groupId: 'fg1',
    });
    const res = await v1CreateFund(req, mockSession() as never);
    const json = await res.json();

    expect(json.data.groupId).toBe('fg1');
    expect(json.data.groupName).toBe('Emergency');
    expect(FundsService.create).toHaveBeenCalledWith(
      SESSION_ID,
      expect.objectContaining({ groupId: 'fg1' }),
    );
  });
});
