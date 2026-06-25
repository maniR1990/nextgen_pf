import { ConflictError, isApiError } from '@/lib/api/errors';
import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import type { RouteContext } from '@/lib/api/middleware/types';
import { v1Created, v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import type { InstitutionType } from '@prisma/client';
import { InstitutionsRepository } from './institutions.repository';
import { CreateInstitutionSchema, ListInstitutionsQuerySchema } from './institutions.schema';

const log = getLogger('InstitutionsRouter');

export const v1ListInstitutions = async (req: Request, _ctx: RouteContext) => {
  try {
    const url = new URL(req.url);
    const query = ListInstitutionsQuerySchema.parse(Object.fromEntries(url.searchParams));
    const data = await InstitutionsRepository.findMany({
      type: query.type as InstitutionType | undefined,
      search: query.search,
      limit: query.limit,
    });
    return v1Ok(data);
  } catch (err) {
    log.error('v1ListInstitutions', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
};

export const v1CreateInstitution = compose(
  withAuth(),
  withValidation(CreateInstitutionSchema),
)(async (req, _ctx) => {
  try {
    const dto = CreateInstitutionSchema.parse(await req.json());
    const result = await InstitutionsRepository.create({
      ...dto,
      isActive: true,
      isVerified: false,
    });
    return v1Created(result);
  } catch (err) {
    log.error('v1CreateInstitution', { err });
    if (isApiError(err)) return v1FromApiError(err);
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return v1FromApiError(
        new ConflictError('An institution with that short name already exists'),
      );
    }
    throw err;
  }
});
