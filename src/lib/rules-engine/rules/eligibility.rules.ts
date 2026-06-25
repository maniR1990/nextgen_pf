import type { RuleProperties } from 'json-rules-engine';

export const eligibilityRules: RuleProperties[] = [
  {
    name: 'premium-tier',
    conditions: {
      all: [{ fact: 'transactionCount', operator: 'greaterThanInclusive', value: 50 }],
    },
    event: { type: 'ELIGIBLE', params: { tier: 'premium' } },
  },
];
