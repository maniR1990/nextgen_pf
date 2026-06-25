import { isApiError } from '@/lib/api/errors';
import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { v1Created, v1FromApiError, v1Ok, v1OkMeta } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import {
  CreateCategorySchema,
  ListCategoriesQuerySchema,
  ReorderCategoriesSchema,
  UpdateCategorySchema,
} from './categories.schema';
import { CategoriesService } from './categories.service';

const log = getLogger('CategoriesRouter');

function missingId() {
  return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
}

export const v1ListCategories = compose(withAuth())(async (req, ctx) => {
  try {
    const url = new URL(req.url);
    const query = ListCategoriesQuerySchema.parse(Object.fromEntries(url.searchParams));
    const { data, meta } = await CategoriesService.list(ctx.session!.id, query);
    return v1OkMeta(data, meta);
  } catch (err) {
    log.error('v1ListCategories', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1CreateCategory = compose(
  withAuth(),
  withValidation(CreateCategorySchema),
)(async (req, ctx) => {
  try {
    const dto = CreateCategorySchema.parse(await req.json());
    const result = await CategoriesService.create(ctx.session!.id, dto);
    return v1Created(result);
  } catch (err) {
    log.error('v1CreateCategory', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1GetCategory = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const result = await CategoriesService.getById(id, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1GetCategory', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1UpdateCategory = compose(
  withAuth(),
  withValidation(UpdateCategorySchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const dto = UpdateCategorySchema.parse(await req.json());
    const result = await CategoriesService.update(id, ctx.session!.id, dto);
    return v1Ok(result);
  } catch (err) {
    log.error('v1UpdateCategory', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1ReorderCategories = compose(
  withAuth(),
  withValidation(ReorderCategoriesSchema),
)(async (req, ctx) => {
  try {
    const items = ReorderCategoriesSchema.parse(await req.json());
    const { data, meta } = await CategoriesService.reorder(ctx.session!.id, items);
    return v1OkMeta(data, meta);
  } catch (err) {
    log.error('v1ReorderCategories', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1DeleteCategory = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const result = await CategoriesService.delete(id, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1DeleteCategory', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1GetCategoryStats = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const result = await CategoriesService.getStats(id, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1GetCategoryStats', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
