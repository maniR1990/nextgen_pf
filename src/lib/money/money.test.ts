import { describe, expect, it } from 'vitest';
import { calculateAprFromApy, calculateApy } from './apy';
import { addDecimal, addMoney, multiplyDecimal } from './arithmetic';
import { formatMoney } from './formatMoney';
import { moneyFromDecimal, parseMoney } from './parseMoney';

describe('money helpers', () => {
  it('parses currency strings into dinero minor units', () => {
    const amount = parseMoney('$1,234.56');
    expect(formatMoney(amount)).toBe('$1,234.56');
  });

  it('creates money from decimal values', () => {
    const amount = moneyFromDecimal(42.5);
    expect(formatMoney(amount)).toBe('$42.50');
  });

  it('performs safe decimal arithmetic', () => {
    expect(addDecimal(0.1, 0.2)).toBe(0.3);
    expect(multiplyDecimal(19.99, 3)).toBe(59.97);
  });

  it('adds dinero amounts immutably', () => {
    const a = moneyFromDecimal(10);
    const b = moneyFromDecimal(5.5);
    expect(formatMoney(addMoney(a, b))).toBe('$15.50');
  });

  it('calculates APY from APR', () => {
    const apy = calculateApy(5, 12);
    expect(apy).toBeGreaterThan(5);
    expect(apy).toBeLessThan(5.2);
  });

  it('calculates APR from APY', () => {
    const apr = calculateAprFromApy(5.1162, 12);
    expect(apr).toBeCloseTo(5, 1);
  });
});
