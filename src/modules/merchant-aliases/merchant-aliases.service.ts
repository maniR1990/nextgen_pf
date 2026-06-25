import { getLogger } from '@/lib/logger';
import { MerchantAliasesRepository } from './merchant-aliases.repository';

const log = getLogger('MerchantAliasesService');

export interface CreateMerchantAliasDto {
  pattern: string;
  categoryId: string;
  /** 'EXACT' (default, case-insensitive contains) or 'REGEX' */
  method?: 'EXACT' | 'REGEX';
}

/** Case-insensitive substring match; optionally treat pattern as a regex */
function matchAlias(
  alias: { pattern: string; categoryId: string | null },
  merchantName: string,
  method: 'EXACT' | 'REGEX' = 'EXACT',
): boolean {
  if (method === 'REGEX') {
    try {
      return new RegExp(alias.pattern, 'i').test(merchantName);
    } catch {
      return false;
    }
  }
  return merchantName.toUpperCase().includes(alias.pattern.toUpperCase());
}

export const MerchantAliasesService = {
  async list(userId: string) {
    return MerchantAliasesRepository.findByUserId(userId);
  },

  async create(userId: string, dto: CreateMerchantAliasDto) {
    log.info('create merchant alias', { pattern: dto.pattern });
    return MerchantAliasesRepository.create({
      pattern: dto.pattern,
      category: { connect: { id: dto.categoryId } },
      confidence: 1,
      source: 'USER' as never,
      ...(userId && { user: { connect: { id: userId } } }),
    });
  },

  async match(userId: string, merchantName: string, method: 'EXACT' | 'REGEX' = 'EXACT') {
    const aliases = await MerchantAliasesRepository.findByUserId(userId);
    const matched = aliases
      .filter((a) => matchAlias(a, merchantName, method))
      .sort((a, b) => b.confidence - a.confidence);
    return matched[0] ?? null;
  },
};
