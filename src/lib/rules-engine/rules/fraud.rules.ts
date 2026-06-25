import type { RuleProperties } from 'json-rules-engine';

export const fraudRules: RuleProperties[] = [
  {
    name: 'high-value-new-user',
    conditions: {
      all: [
        { fact: 'amount', operator: 'greaterThan', value: 10000 },
        { fact: 'accountAgeDays', operator: 'lessThan', value: 30 },
      ],
    },
    event: {
      type: 'FRAUD_ALERT',
      params: { reason: 'high-value-new-user', block: true },
    },
    priority: 10,
  },
  {
    name: 'unusual-location',
    conditions: {
      all: [
        { fact: 'countryMatch', operator: 'equal', value: false },
        { fact: 'amount', operator: 'greaterThan', value: 500 },
      ],
    },
    event: {
      type: 'FRAUD_ALERT',
      params: { reason: 'unusual-location', block: false },
    },
  },
];
