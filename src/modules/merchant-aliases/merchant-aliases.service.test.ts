import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MerchantAliasesRepository } from './merchant-aliases.repository';
import { MerchantAliasesService } from './merchant-aliases.service';

vi.mock('./merchant-aliases.repository');

const mockAlias = {
  id: 'ma1',
  userId: 'u1',
  pattern: 'SWIGGY',
  categoryId: 'cat1',
  method: 'EXACT',
  confidence: 1,
  source: 'USER',
  createdAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('MerchantAliasesService.list', () => {
  it('returns all aliases for the user', async () => {
    vi.mocked(MerchantAliasesRepository.findByUserId).mockResolvedValue([mockAlias] as never);
    const result = await MerchantAliasesService.list('u1');
    expect(result).toHaveLength(1);
  });
});

describe('MerchantAliasesService.create', () => {
  it('creates a user-defined alias', async () => {
    vi.mocked(MerchantAliasesRepository.create).mockResolvedValue(mockAlias as never);
    const result = await MerchantAliasesService.create('u1', {
      pattern: 'SWIGGY',
      categoryId: 'cat1',
      method: 'EXACT',
    });
    expect(result.id).toBe('ma1');
  });
});

describe('MerchantAliasesService.match', () => {
  it('returns the best match for a merchant name', async () => {
    vi.mocked(MerchantAliasesRepository.findByUserId).mockResolvedValue([mockAlias] as never);
    const result = await MerchantAliasesService.match('u1', 'SWIGGY ORDER 12345');
    expect(result).not.toBeNull();
    expect(result!.categoryId).toBe('cat1');
  });

  it('returns null when no alias matches', async () => {
    vi.mocked(MerchantAliasesRepository.findByUserId).mockResolvedValue([mockAlias] as never);
    const result = await MerchantAliasesService.match('u1', 'AMAZON PAY');
    expect(result).toBeNull();
  });
});
