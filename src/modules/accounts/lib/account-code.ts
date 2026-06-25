import type { AccountType } from '@prisma/client';
import {
  ACCOUNT_TYPE_CODE_PREFIX,
  isLiabilityAccountType,
  UTILISATION_ACCOUNT_TYPES,
} from '@/constants/accounts';
import type { AccountHealth, UpcomingEventItem } from '../accounts.types';

interface HealthInput {
  balance: number;
  type: AccountType;
  creditLimit: number | null;
  archivedAt: Date | null;
  fundFillPercent: number;
  upcomingEvents: UpcomingEventItem[];
}

export function buildAccountCode(
  institutionShortName: string | undefined,
  type: AccountType,
  sequence: number,
): string {
  const inst = (institutionShortName ?? 'ACC').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'ACC';
  const typeAbbrev = ACCOUNT_TYPE_CODE_PREFIX[type] ?? 'GEN';
  return `${inst}-${typeAbbrev}-${String(sequence).padStart(2, '0')}`;
}

export function computeAccountHealth(input: HealthInput): AccountHealth {
  if (input.archivedAt) {
    return {
      healthScore: 0,
      utilisationPercent: null,
      fundFillPercent: input.fundFillPercent,
      upcomingEvents: input.upcomingEvents,
    };
  }

  let score = 100;
  const utilisationPercent =
    UTILISATION_ACCOUNT_TYPES.includes(input.type) &&
    input.creditLimit &&
    input.creditLimit > 0
      ? Math.round((Math.abs(input.balance) / input.creditLimit) * 100)
      : null;

  if (utilisationPercent !== null) {
    if (utilisationPercent > 90) score -= 35;
    else if (utilisationPercent > 70) score -= 20;
    else if (utilisationPercent > 50) score -= 10;
  }

  if (input.balance < 0 && !isLiabilityAccountType(input.type)) score -= 25;
  if (input.fundFillPercent < 50) score -= 15;
  else if (input.fundFillPercent < 80) score -= 5;

  if (input.upcomingEvents.length > 3) score -= 5;

  return {
    healthScore: Math.max(0, Math.min(100, score)),
    utilisationPercent,
    fundFillPercent: input.fundFillPercent,
    upcomingEvents: input.upcomingEvents,
  };
}
