import Decimal from 'decimal.js';

/**
 * APR/APY calculation stub — extend when lending/savings features ship.
 * Uses decimal.js for precision; services should call this, not chart/UI layers.
 */
export function calculateApy(aprPercent: number, compoundsPerYear = 12): number {
  const apr = new Decimal(aprPercent).div(100);
  const n = new Decimal(compoundsPerYear);
  const apy = apr.div(n).plus(1).pow(n).minus(1).times(100);
  return apy.toDecimalPlaces(4).toNumber();
}

export function calculateAprFromApy(apyPercent: number, compoundsPerYear = 12): number {
  const apy = new Decimal(apyPercent).div(100);
  const n = new Decimal(compoundsPerYear);
  const apr = n.times(apy.plus(1).pow(new Decimal(1).div(n)).minus(1)).times(100);
  return apr.toDecimalPlaces(4).toNumber();
}
