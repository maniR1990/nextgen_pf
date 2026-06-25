import type { FundPurpose } from '@prisma/client';

export interface FundGroupSummary {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  purposeHint: FundPurpose | null;
  order: number;
  color: string | null;
  isSystem: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFundGroupDto {
  name: string;
  description?: string;
  color?: string;
  order?: number;
}

export interface UpdateFundGroupDto {
  name?: string;
  description?: string;
  color?: string;
  order?: number;
}
