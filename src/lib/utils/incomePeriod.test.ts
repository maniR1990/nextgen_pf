import { describe, expect, it } from 'vitest';
import { formatAmountShort, getIncomePeriodData } from './incomePeriod';

// ─── helpers ─────────────────────────────────────────────────────────────────

function recommended(data: ReturnType<typeof getIncomePeriodData>) {
  return data.suggestions.find((s) => s.recommended)!;
}

function secondary(data: ReturnType<typeof getIncomePeriodData>) {
  return data.suggestions.find((s) => !s.recommended)!;
}

// ─── June / July transition ───────────────────────────────────────────────────
// June has 30 calendar days.  isNearEnd = day >= 26  (30 - 4).
// LWD of June 2026 = June 30 (Tuesday — no weekend adjustment needed).

describe('June → July transition', () => {
  it('mid-month (June 14) → June recommended, July is the alternative', () => {
    const data = getIncomePeriodData('2026-06-14');
    expect(recommended(data)).toMatchObject({ year: 2026, month: 6, recommended: true });
    expect(secondary(data)).toMatchObject({ year: 2026, month: 7, recommended: false });
  });

  it('one day before near-end boundary (June 25) → June still recommended', () => {
    const data = getIncomePeriodData('2026-06-25');
    expect(recommended(data)).toMatchObject({ year: 2026, month: 6 });
    expect(data.defaultMonth).toBe(6);
    expect(data.defaultYear).toBe(2026);
  });

  it('near-end boundary (June 26 = lastCalDay - 4) → July becomes recommended', () => {
    const data = getIncomePeriodData('2026-06-26');
    expect(recommended(data)).toMatchObject({ year: 2026, month: 7 });
    expect(data.defaultMonth).toBe(7);
    expect(data.defaultYear).toBe(2026);
  });

  it('June 27 (near end, typical Indian salary date) → July recommended', () => {
    const data = getIncomePeriodData('2026-06-27');
    expect(recommended(data)).toMatchObject({ year: 2026, month: 7 });
    expect(data.bankDateHint).toBeNull(); // 27 is not the LWD (LWD = 30)
  });

  it('June 30 (last working day of June 2026 — Tuesday) → July recommended + LWD hint', () => {
    const data = getIncomePeriodData('2026-06-30');
    expect(recommended(data)).toMatchObject({ year: 2026, month: 7 });
    expect(data.defaultMonth).toBe(7);
    expect(data.bankDateHint).toMatch(/Last working day of June/i);
  });

  it('defaultYear and defaultMonth always point at the recommended suggestion', () => {
    for (const day of [1, 14, 25, 26, 28, 30]) {
      const data = getIncomePeriodData(`2026-06-${String(day).padStart(2, '0')}`);
      const rec = recommended(data);
      expect(data.defaultYear).toBe(rec.year);
      expect(data.defaultMonth).toBe(rec.month);
    }
  });

  it('suggestions[0] is always the recommended suggestion (order invariant)', () => {
    for (const day of [1, 14, 25, 26, 28, 30]) {
      const data = getIncomePeriodData(`2026-06-${String(day).padStart(2, '0')}`);
      expect(data.suggestions[0].recommended).toBe(true);
      expect(data.suggestions[1].recommended).toBe(false);
    }
  });

  it('always returns exactly 2 suggestions', () => {
    for (const day of [1, 15, 26, 30]) {
      const data = getIncomePeriodData(`2026-06-${String(day).padStart(2, '0')}`);
      expect(data.suggestions).toHaveLength(2);
    }
  });
});

// ─── December / January year rollover ────────────────────────────────────────
// December has 31 days.  isNearEnd = day >= 27  (31 - 4).
// LWD of December 2026 = Dec 31 (Thursday — no weekend adjustment).

describe('December → January year rollover', () => {
  it('mid-month (Dec 14) → December 2026 recommended', () => {
    const data = getIncomePeriodData('2026-12-14');
    expect(recommended(data)).toMatchObject({ year: 2026, month: 12 });
    expect(secondary(data)).toMatchObject({ year: 2027, month: 1 });
  });

  it('near-end (Dec 28) → January 2027 recommended, year increments correctly', () => {
    const data = getIncomePeriodData('2026-12-28');
    expect(recommended(data)).toMatchObject({ year: 2027, month: 1, recommended: true });
    expect(data.defaultYear).toBe(2027);
    expect(data.defaultMonth).toBe(1);
  });

  it('Dec 31, 2026 (Thursday = LWD) → January 2027 recommended + LWD hint', () => {
    const data = getIncomePeriodData('2026-12-31');
    expect(recommended(data)).toMatchObject({ year: 2027, month: 1 });
    expect(data.bankDateHint).toMatch(/Last working day of December/i);
  });

  it('secondary suggestion in December is always current month, not a third year', () => {
    const data = getIncomePeriodData('2026-12-28');
    expect(secondary(data)).toMatchObject({ year: 2026, month: 12 });
  });
});

// ─── Last-working-day detection: weekend adjustments ─────────────────────────

describe('LWD adjustment when month ends on Saturday (January 2026)', () => {
  // Jan 31, 2026 = Saturday → LWD = Jan 30 (Friday)

  it('Jan 30 (Friday = LWD) → bankDateHint present', () => {
    const data = getIncomePeriodData('2026-01-30');
    expect(data.bankDateHint).toMatch(/Last working day of January/i);
  });

  it('Jan 31 (Saturday, not LWD) → no bankDateHint', () => {
    const data = getIncomePeriodData('2026-01-31');
    expect(data.bankDateHint).toBeNull();
  });

  it('Jan 29 (Thursday, not LWD) → no bankDateHint', () => {
    const data = getIncomePeriodData('2026-01-29');
    expect(data.bankDateHint).toBeNull();
  });
});

describe('LWD adjustment when month ends on Sunday (May 2026)', () => {
  // May 31, 2026 = Sunday → LWD = May 29 (Friday)

  it('May 29 (Friday = LWD) → bankDateHint present + June recommended (near end)', () => {
    const data = getIncomePeriodData('2026-05-29');
    expect(data.bankDateHint).toMatch(/Last working day of May/i);
    expect(recommended(data)).toMatchObject({ year: 2026, month: 6 });
  });

  it('May 30 (Saturday, not LWD, but isNearEnd) → June recommended, no bankDateHint', () => {
    const data = getIncomePeriodData('2026-05-30');
    expect(data.bankDateHint).toBeNull();
    expect(recommended(data)).toMatchObject({ year: 2026, month: 6 });
  });

  it('May 31 (Sunday, not LWD, but isNearEnd) → June recommended, no bankDateHint', () => {
    const data = getIncomePeriodData('2026-05-31');
    expect(data.bankDateHint).toBeNull();
    expect(recommended(data)).toMatchObject({ year: 2026, month: 6 });
  });
});

// ─── The user's primary salary scenario ───────────────────────────────────────
// "My salary for July arrives on June's last working day."
// In 2026 that is June 30 (Tuesday).

describe('primary salary scenario: July salary credited June 30', () => {
  it('assigns income to July 2026 budget', () => {
    const data = getIncomePeriodData('2026-06-30');
    expect(data.defaultYear).toBe(2026);
    expect(data.defaultMonth).toBe(7);
  });

  it('shows LWD hint so user knows this is the expected credit date', () => {
    const data = getIncomePeriodData('2026-06-30');
    expect(data.bankDateHint).not.toBeNull();
  });

  it('reason card explains money funds July', () => {
    const data = getIncomePeriodData('2026-06-30');
    const rec = recommended(data);
    expect(rec.reason).toMatch(/July/i);
  });

  it('current-month (June) card is still available as an alternative', () => {
    const data = getIncomePeriodData('2026-06-30');
    const alt = secondary(data);
    expect(alt).toMatchObject({ year: 2026, month: 6 });
  });
});

// ─── formatAmountShort ────────────────────────────────────────────────────────

describe('formatAmountShort', () => {
  it('returns empty for falsy / zero / negative', () => {
    expect(formatAmountShort('')).toBe('');
    expect(formatAmountShort('0')).toBe('');
    expect(formatAmountShort('0.00')).toBe('');
    expect(formatAmountShort('-500')).toBe('');
  });

  it('formats sub-1000 amounts as plain ₹', () => {
    expect(formatAmountShort('500')).toBe('+₹500');
    expect(formatAmountShort('999')).toBe('+₹999');
  });

  it('formats 1K–99K as rounded K', () => {
    expect(formatAmountShort('1000')).toBe('+₹1K');
    expect(formatAmountShort('50000')).toBe('+₹50K');
    expect(formatAmountShort('99999')).toBe('+₹100K'); // rounds up
  });

  it('formats 1L and above as L with one decimal', () => {
    expect(formatAmountShort('100000')).toBe('+₹1L');
    expect(formatAmountShort('150000')).toBe('+₹1.5L');
    expect(formatAmountShort('1000000')).toBe('+₹10L');
  });

  it('drops trailing .0 from L format', () => {
    expect(formatAmountShort('200000')).toBe('+₹2L');
    expect(formatAmountShort('300000')).toBe('+₹3L');
  });
});
