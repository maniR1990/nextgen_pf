import { Engine } from 'json-rules-engine';
import { FraudDetectedError } from '@/lib/api/errors';
import { fraudRules } from './rules/fraud.rules';
import type { FraudFacts } from './rules.types';

export async function evaluateFraud(facts: FraudFacts) {
  const engine = new Engine(fraudRules);
  const { events } = await engine.run(facts);
  const blocking = events.filter((e) => e.params?.block);

  if (blocking.length) {
    throw new FraudDetectedError(blocking[0].params?.reason as string);
  }

  return events;
}
