import currency from 'currency.js';
import { type Dinero, add, multiply, subtract } from 'dinero.js';

/** Safe decimal arithmetic via currency.js (display-layer calculations). */
export function addDecimal(a: number, b: number): number {
  return currency(a).add(b).value;
}

export function subtractDecimal(a: number, b: number): number {
  return currency(a).subtract(b).value;
}

export function multiplyDecimal(a: number, factor: number): number {
  return currency(a).multiply(factor).value;
}

export function divideDecimal(a: number, divisor: number): number {
  return currency(a).divide(divisor).value;
}

/** Immutable Dinero arithmetic. */
export function addMoney(a: Dinero<number>, b: Dinero<number>): Dinero<number> {
  return add(a, b);
}

export function subtractMoney(a: Dinero<number>, b: Dinero<number>): Dinero<number> {
  return subtract(a, b);
}

export function multiplyMoney(amount: Dinero<number>, multiplier: number): Dinero<number> {
  return multiply(amount, multiplier);
}
