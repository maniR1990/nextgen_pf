import { describe, it, expect } from 'vitest';
import {
  ACCOUNT_ASSET_TYPES,
  ACCOUNT_LIABILITY_TYPES,
  ACCOUNT_TAX_BENEFIT_TYPES,
  ACCOUNT_TYPE_META,
  ACCOUNT_TYPES,
  DEFAULT_ACCOUNT_GROUP_TEMPLATES,
  getAccountTypeBySlug,
  isAssetAccountType,
  isLiabilityAccountType,
  LEGACY_ACCOUNT_TYPE_MAP,
} from './accounts';

describe('Account type taxonomy', () => {
  it('defines 41 account types (31 assets + 10 liabilities)', () => {
    expect(ACCOUNT_TYPES).toHaveLength(41);
    expect(ACCOUNT_ASSET_TYPES).toHaveLength(31);
    expect(ACCOUNT_LIABILITY_TYPES).toHaveLength(10);
  });

  it('maps every type to unique slug and code prefix', () => {
    const slugs = ACCOUNT_TYPES.map((t) => ACCOUNT_TYPE_META[t].slug);
    const prefixes = ACCOUNT_TYPES.map((t) => ACCOUNT_TYPE_META[t].codePrefix);
    expect(new Set(slugs).size).toBe(41);
    expect(new Set(prefixes).size).toBe(41);
  });

  it('resolves slug lookup', () => {
    expect(getAccountTypeBySlug('inv_ppf')).toBe('INV_PPF');
    expect(getAccountTypeBySlug('loan_personal')).toBe('LOAN_PERSONAL');
    expect(getAccountTypeBySlug('unknown')).toBeUndefined();
  });

  it('classifies balance-sheet sides', () => {
    expect(isAssetAccountType('BANK_SAVINGS')).toBe(true);
    expect(isLiabilityAccountType('CREDIT_CARD')).toBe(true);
    expect(isLiabilityAccountType('BNPL')).toBe(true);
    expect(isAssetAccountType('INV_ELSS')).toBe(true);
  });

  it('marks tax-benefit investment types', () => {
    expect(ACCOUNT_TAX_BENEFIT_TYPES).toContain('INV_PPF');
    expect(ACCOUNT_TAX_BENEFIT_TYPES).toContain('GOLD_SGB');
    expect(ACCOUNT_TAX_BENEFIT_TYPES).not.toContain('INV_STOCKS');
  });

  it('provides default account group templates for all taxonomy groups', () => {
    expect(DEFAULT_ACCOUNT_GROUP_TEMPLATES).toHaveLength(7);
    const slugs = DEFAULT_ACCOUNT_GROUP_TEMPLATES.map((g) => g.slug);
    expect(slugs).toContain('banking');
    expect(slugs).toContain('liabilities');
  });

  it('maps legacy payment source types to v2', () => {
    expect(LEGACY_ACCOUNT_TYPE_MAP.ATM_CASH).toBe('CASH_ATM');
    expect(LEGACY_ACCOUNT_TYPE_MAP.INVESTMENT_MF).toBe('INV_MF_EQUITY');
    expect(LEGACY_ACCOUNT_TYPE_MAP.LOAN_VEHICLE).toBe('LOAN_CAR');
  });
});
