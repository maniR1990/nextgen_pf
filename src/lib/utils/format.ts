export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/** Full INR format — ₹89,432. Pass `decimals` to force a fixed decimal count (e.g. 2)
 *  so a column of otherwise inconsistent whole/fractional rupee amounts lines up
 *  cleanly once right-aligned — without it, amounts keep whatever precision they
 *  actually have (₹1,700 next to ₹812.09). */
export function formatINR(amount: number, decimals?: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '−' : '';
  const opts: Intl.NumberFormatOptions | undefined =
    decimals === undefined
      ? undefined
      : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
  return `${sign}₹${abs.toLocaleString('en-IN', opts)}`;
}

/** Compact INR — ₹47.2L, ₹1.3Cr, ₹6,817 */
export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '−' : '';
  if (abs >= 10_000_000) return `${sign}₹${(abs / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `${sign}₹${(abs / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${abs}`;
}

/** Format a signed percentage change — +2.3% */
export function formatChangePct(pct: number): string {
  const sign = pct >= 0 ? '+' : '−';
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

export function truncate(str: string, max = 50): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}
