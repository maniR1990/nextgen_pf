import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'schema.prisma');
const schema = readFileSync(schemaPath, 'utf-8');

function extractBlock(kind: 'model' | 'type' | 'enum', name: string): string {
  const regex = new RegExp(`${kind} ${name}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm');
  const match = schema.match(regex);
  expect(match, `${kind} ${name} should exist`).toBeTruthy();
  return match![1];
}

function hasScalarField(block: string, fieldName: string): boolean {
  return new RegExp(`^\\s+${fieldName}\\s+`, 'm').test(block);
}

function hasEmbeddedField(block: string, fieldName: string): boolean {
  return new RegExp(`^\\s+${fieldName}\\s+\\w+`, 'm').test(block);
}

function hasIndexOrUnique(block: string, fields: string[], unique = false): boolean {
  const directive = unique ? '@@unique' : '@@index';
  const fieldList = fields.join(',\\s*');
  return new RegExp(`${directive}\\(\\[${fieldList}\\]\\)`).test(block);
}

function extractEnumValues(enumName: string): string[] {
  const block = extractBlock('enum', enumName);
  return [...block.matchAll(/^\s+(\w+)\s*$/gm)].map((m) => m[1]);
}

describe('schema v2 — core models exist', () => {
  const coreModels = ['Account', 'AccountGroup', 'Institution', 'Fund', 'Category'] as const;

  for (const model of coreModels) {
    it(`defines model ${model}`, () => {
      expect(schema).toMatch(new RegExp(`model ${model}\\s*\\{`));
    });
  }
});

describe('schema v2 — embedded types exist', () => {
  const embeddedTypes = ['BillingCycle', 'FundAllocation', 'MatchRule'] as const;

  for (const typeName of embeddedTypes) {
    it(`defines type ${typeName}`, () => {
      expect(schema).toMatch(new RegExp(`type ${typeName}\\s*\\{`));
    });
  }
});

describe('schema v2 — no legacy duplicate models', () => {
  const legacyModels = ['PaymentSource', 'CategoryNode', 'SinkingFund'] as const;

  for (const legacy of legacyModels) {
    it(`does not define legacy model ${legacy}`, () => {
      expect(schema).not.toMatch(new RegExp(`model ${legacy}\\s*\\{`));
    });
  }
});

describe('schema v2 — Account fields', () => {
  const account = () => extractBlock('model', 'Account');

  const requiredFields = [
    'userId',
    'groupId',
    'name',
    'type',
    'balance',
    'openingBalance',
  ] as const;

  const allFields = [
    ...requiredFields,
    'institutionId',
    'code',
    'subtype',
    'currency',
    'balanceAsOf',
    'accountNumber',
    'ifscCode',
    'upiId',
    'creditLimit',
    'billingCycle',
    'interestRate',
    'minimumPayment',
    'investedAmount',
    'currentValue',
    'absoluteReturn',
    'xirr',
    'maturityDate',
    'lockInMonths',
    'expectedReturn',
    'category80C',
    'principalAmount',
    'emi',
    'remainingEmis',
    'interestPaidTotal',
    'fundAllocations',
    'linkedAccountIds',
    'status',
    'isPrimary',
    'isExcludeNetWorth',
    'isHidden',
    'color',
    'icon',
    'note',
    'tags',
    'openedOn',
    'archivedAt',
    'createdAt',
    'updatedAt',
  ] as const;

  for (const field of allFields) {
    it(`has field ${field}`, () => {
      expect(hasScalarField(account(), field) || hasEmbeddedField(account(), field)).toBe(true);
    });
  }

  it('maps _id via @map', () => {
    expect(account()).toMatch(/@map\("_id"\)/);
  });

  it('indexes userId', () => {
    expect(hasIndexOrUnique(account(), ['userId'])).toBe(true);
  });

  it('unique index on userId + code', () => {
    expect(hasIndexOrUnique(account(), ['userId', 'code'], true)).toBe(true);
  });
});

describe('schema v2 — AccountGroup fields', () => {
  const group = () => extractBlock('model', 'AccountGroup');

  const fields = [
    'userId',
    'name',
    'type',
    'slug',
    'order',
    'icon',
    'color',
    'isDefault',
    'isCollapsed',
    'archivedAt',
    'createdAt',
  ] as const;

  for (const field of fields) {
    it(`has field ${field}`, () => {
      expect(hasScalarField(group(), field)).toBe(true);
    });
  }

  it('indexes userId', () => {
    expect(hasIndexOrUnique(group(), ['userId'])).toBe(true);
  });
});

describe('schema v2 — Institution fields', () => {
  const institution = () => extractBlock('model', 'Institution');

  const fields = [
    'name',
    'shortName',
    'type',
    'logoUrl',
    'color',
    'ifscPattern',
    'isActive',
    'isVerified',
  ] as const;

  for (const field of fields) {
    it(`has field ${field}`, () => {
      expect(hasScalarField(institution(), field)).toBe(true);
    });
  }
});

describe('schema v2 — Fund fields', () => {
  const fund = () => extractBlock('model', 'Fund');

  const fields = [
    'userId',
    'name',
    'purpose',
    'targetAmount',
    'targetMonths',
    'sources',
    'goalId',
    'color',
    'icon',
    'order',
    'createdAt',
  ] as const;

  for (const field of fields) {
    it(`has field ${field}`, () => {
      expect(hasScalarField(fund(), field) || hasEmbeddedField(fund(), field)).toBe(true);
    });
  }

  it('does not store currentAmount (computed only)', () => {
    expect(hasScalarField(fund(), 'currentAmount')).toBe(false);
    expect(schema).toMatch(/currentAmount.*COMPUTED|COMPUTED.*currentAmount/i);
  });

  it('indexes userId', () => {
    expect(hasIndexOrUnique(fund(), ['userId'])).toBe(true);
  });
});

describe('schema v2 — FundAllocation embedded type', () => {
  const allocation = () => extractBlock('type', 'FundAllocation');

  const fields = ['fundId', 'accountId', 'type', 'value', 'priority'] as const;

  for (const field of fields) {
    it(`has field ${field}`, () => {
      expect(hasScalarField(allocation(), field)).toBe(true);
    });
  }
});

describe('schema v2 — Category fields', () => {
  const category = () => extractBlock('model', 'Category');

  const fields = [
    'userId',
    'name',
    'slug',
    'parentId',
    'level',
    'path',
    'type',
    'monthlyBudget',
    'budgetRollover',
    'matchRules',
    'color',
    'icon',
    'order',
    'isSystem',
    'isActive',
    'createdAt',
  ] as const;

  for (const field of fields) {
    it(`has field ${field}`, () => {
      expect(hasScalarField(category(), field) || hasEmbeddedField(category(), field)).toBe(true);
    });
  }

  it('indexes userId + path', () => {
    expect(hasIndexOrUnique(category(), ['userId', 'path'])).toBe(true);
  });
});

describe('schema v2 — MatchRule embedded type', () => {
  const rule = () => extractBlock('type', 'MatchRule');

  const fields = ['field', 'operator', 'value', 'priority'] as const;

  for (const field of fields) {
    it(`has field ${field}`, () => {
      expect(hasScalarField(rule(), field)).toBe(true);
    });
  }
});

describe('schema v2 — BillingCycle embedded type', () => {
  const cycle = () => extractBlock('type', 'BillingCycle');

  it('has startDay and dueDay', () => {
    expect(hasScalarField(cycle(), 'startDay')).toBe(true);
    expect(hasScalarField(cycle(), 'dueDay')).toBe(true);
  });
});

describe('schema v2 — enums match spec', () => {
  it('AccountGroupType is asset | liability', () => {
    expect(extractEnumValues('AccountGroupType').sort()).toEqual(['ASSET', 'LIABILITY']);
  });

  it('FundAllocationType is percentage | fixed', () => {
    expect(extractEnumValues('FundAllocationType').sort()).toEqual(['FIXED', 'PERCENTAGE']);
  });

  it('CategoryFlowType covers income | expense | investment | transfer', () => {
    expect(extractEnumValues('CategoryFlowType').sort()).toEqual([
      'EXPENSE',
      'INCOME',
      'INVESTMENT',
      'TRANSFER',
    ]);
  });
});
