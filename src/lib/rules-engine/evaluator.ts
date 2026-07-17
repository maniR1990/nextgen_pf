import { FraudDetectedError } from '@/lib/api/errors';
import { INFLOW_TYPES } from '@/modules/transactions/period-spend';
import { Engine } from 'json-rules-engine';
import type { FraudFacts } from './rules.types';
import { fraudRules } from './rules/fraud.rules';

// Human-readable messages for each fraud rule slug
const FRAUD_MESSAGES: Record<string, string> = {
  'high-value-new-user':
    'Large transactions are temporarily restricted for new accounts. Please contact support if you need assistance.',
  'unusual-location':
    'This transaction was flagged due to an unusual location. Please verify and try again.',
};

// Same inflow classification every period-total view uses — see period-spend.ts. A
// second hardcoded list here would silently miss any inflow type added there later,
// wrongly subjecting it to fraud rules meant for spend.
const INFLOW_TYPE_SET: Set<string> = new Set(INFLOW_TYPES);

export async function evaluateFraud(facts: FraudFacts) {
  // Skip fraud checks entirely for income/inflow transactions
  if (facts.txType && INFLOW_TYPE_SET.has(facts.txType)) return [];

  const engine = new Engine(fraudRules);
  const { events } = await engine.run(facts);
  const blocking = events.filter((e) => e.params?.block);

  if (blocking.length) {
    const slug = blocking[0].params?.reason as string;
    const message =
      FRAUD_MESSAGES[slug] ?? 'This transaction was flagged for review. Please contact support.';
    throw new FraudDetectedError(message);
  }

  return events;
}
