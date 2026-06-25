import { FraudDetectedError } from '@/lib/api/errors';
import { describe, expect, it } from 'vitest';
import { evaluateFraud } from './evaluator';

describe('evaluateFraud', () => {
  it('throws FraudDetectedError for high-value new user', async () => {
    await expect(
      evaluateFraud({ amount: 15000, accountAgeDays: 10, countryMatch: true }),
    ).rejects.toThrow(FraudDetectedError);
  });

  it('passes for normal transaction', async () => {
    const events = await evaluateFraud({ amount: 100, accountAgeDays: 180, countryMatch: true });
    expect(events).toHaveLength(0);
  });

  it('returns non-blocking event for unusual location', async () => {
    const events = await evaluateFraud({ amount: 600, accountAgeDays: 100, countryMatch: false });
    expect(events[0].type).toBe('FRAUD_ALERT');
    expect(events[0].params?.block).toBe(false);
  });

  it('high-value but old account — should pass', async () => {
    const events = await evaluateFraud({ amount: 20000, accountAgeDays: 365, countryMatch: true });
    expect(events.filter((e) => e.params?.block)).toHaveLength(0);
  });
});
