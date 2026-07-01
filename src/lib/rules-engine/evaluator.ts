import { FraudDetectedError } from '@/lib/api/errors';
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

// Transaction types that are inflows — fraud rules for suspicious spend do not apply.
const INFLOW_TYPES = new Set(['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT', 'REFUND']);

export async function evaluateFraud(facts: FraudFacts) {
  // Skip fraud checks entirely for income/inflow transactions
  if (facts.txType && INFLOW_TYPES.has(facts.txType)) return [];

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
