import { describe, expect, it } from 'vitest';
import { formatFiscalPeriod, formatFiscalQuarter, getFiscalYear } from './fiscal';
import { daysSince, formatDate, formatDateIso, formatRelative } from './formatDate';
import { formatInTimeZone, toZonedIso } from './timezone';

describe('date helpers', () => {
  it('formats dates with presets', () => {
    expect(formatDate('2024-03-15')).toMatch(/Mar 15, 2024/);
    expect(formatDateIso('2024-03-15')).toBe('2024-03-15');
  });

  it('computes days since a date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(daysSince(past)).toBe(3);
  });

  it('formats relative time via dayjs', () => {
    expect(formatRelative(new Date())).toBe('a few seconds ago');
  });

  it('resolves US federal fiscal year', () => {
    expect(getFiscalYear('2024-09-30')).toBe(2024);
    expect(getFiscalYear('2024-10-01')).toBe(2025);
    expect(formatFiscalPeriod('2024-11-01')).toBe('FY2025');
    expect(formatFiscalQuarter('2024-11-01')).toBe('Q1 FY2025');
  });

  it('converts ISO timestamps to a target zone', () => {
    const zoned = toZonedIso('2024-01-15T12:00:00.000Z', 'America/New_York');
    expect(zoned).toContain('2024-01-15');
    expect(formatInTimeZone('2024-01-15T12:00:00.000Z', 'UTC')).toContain('2024');
  });
});
