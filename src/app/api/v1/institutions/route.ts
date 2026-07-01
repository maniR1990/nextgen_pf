import { asRouteHandler } from '@/lib/api/middleware';
import { v1CreateInstitution, v1ListInstitutions } from '@/modules/institutions';

export const GET = asRouteHandler(v1ListInstitutions);
export const POST = asRouteHandler(v1CreateInstitution);
