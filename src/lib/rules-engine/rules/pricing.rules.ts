import type { RuleProperties } from 'json-rules-engine';

export const pricingRules: RuleProperties[] = [
  {
    name: 'volume-discount',
    conditions: {
      all: [{ fact: 'amount', operator: 'greaterThan', value: 1000 }],
    },
    event: { type: 'DISCOUNT', params: { percent: 10 } },
  },
];
