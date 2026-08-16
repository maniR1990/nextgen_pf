import { isApiError } from '@/lib/api/errors';
import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { v1Created, v1FromApiError, v1Ok, v1OkMeta } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import {
  CreateActivityItemSchema,
  CreateForecastLineSchema,
  CreateProjectSchema,
  CreateVendorSchema,
  ListProjectsQuerySchema,
  UpdateActivityItemSchema,
  UpdateForecastLineSchema,
  UpdateProjectSchema,
  UpdateVendorSchema,
} from './projects.schema';
import { ProjectsService } from './projects.service';

const log = getLogger('ProjectsRouter');

function missingId() {
  return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
}

export const v1ListProjects = compose(withAuth())(async (req, ctx) => {
  try {
    const url = new URL(req.url);
    const query = ListProjectsQuerySchema.parse(Object.fromEntries(url.searchParams));
    const { data, meta } = await ProjectsService.list(ctx.session!.id, query);
    return v1OkMeta(data, meta);
  } catch (err) {
    log.error('v1ListProjects', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1CreateProject = compose(
  withAuth(),
  withValidation(CreateProjectSchema),
)(async (req, ctx) => {
  try {
    const dto = CreateProjectSchema.parse(await req.json());
    const result = await ProjectsService.create(ctx.session!.id, dto);
    return v1Created(result);
  } catch (err) {
    log.error('v1CreateProject', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1GetProject = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const result = await ProjectsService.get(id, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1GetProject', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1UpdateProject = compose(
  withAuth(),
  withValidation(UpdateProjectSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const dto = UpdateProjectSchema.parse(await req.json());
    const result = await ProjectsService.update(id, ctx.session!.id, dto);
    return v1Ok(result);
  } catch (err) {
    log.error('v1UpdateProject', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1DeleteProject = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    await ProjectsService.hardDelete(id, ctx.session!.id);
    return v1Ok({ deleted: true });
  } catch (err) {
    log.error('v1DeleteProject', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1AddForecastLine = compose(
  withAuth(),
  withValidation(CreateForecastLineSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const dto = CreateForecastLineSchema.parse(await req.json());
    const result = await ProjectsService.addForecastLine(id, ctx.session!.id, dto);
    return v1Created(result);
  } catch (err) {
    log.error('v1AddForecastLine', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1UpdateForecastLine = compose(
  withAuth(),
  withValidation(UpdateForecastLineSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    const lineId = ctx.params?.lineId;
    if (!id || !lineId) {
      return v1FromApiError({
        message: 'Missing id or lineId',
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    const dto = UpdateForecastLineSchema.parse(await req.json());
    const result = await ProjectsService.updateForecastLine(id, lineId, ctx.session!.id, dto);
    return v1Ok(result);
  } catch (err) {
    log.error('v1UpdateForecastLine', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1RemoveForecastLine = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    const lineId = ctx.params?.lineId;
    if (!id || !lineId) {
      return v1FromApiError({
        message: 'Missing id or lineId',
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    const result = await ProjectsService.removeForecastLine(id, lineId, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1RemoveForecastLine', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1AddVendor = compose(
  withAuth(),
  withValidation(CreateVendorSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const dto = CreateVendorSchema.parse(await req.json());
    const result = await ProjectsService.addVendor(id, ctx.session!.id, dto);
    return v1Created(result);
  } catch (err) {
    log.error('v1AddVendor', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1UpdateVendor = compose(
  withAuth(),
  withValidation(UpdateVendorSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    const vendorId = ctx.params?.vendorId;
    if (!id || !vendorId) {
      return v1FromApiError({
        message: 'Missing id or vendorId',
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    const dto = UpdateVendorSchema.parse(await req.json());
    const result = await ProjectsService.updateVendor(id, vendorId, ctx.session!.id, dto);
    return v1Ok(result);
  } catch (err) {
    log.error('v1UpdateVendor', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1RemoveVendor = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    const vendorId = ctx.params?.vendorId;
    if (!id || !vendorId) {
      return v1FromApiError({
        message: 'Missing id or vendorId',
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    const result = await ProjectsService.removeVendor(id, vendorId, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1RemoveVendor', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1AddActivityItem = compose(
  withAuth(),
  withValidation(CreateActivityItemSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const dto = CreateActivityItemSchema.parse(await req.json());
    const result = await ProjectsService.addActivityItem(id, ctx.session!.id, dto);
    return v1Created(result);
  } catch (err) {
    log.error('v1AddActivityItem', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1UpdateActivityItem = compose(
  withAuth(),
  withValidation(UpdateActivityItemSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    const itemId = ctx.params?.itemId;
    if (!id || !itemId) {
      return v1FromApiError({
        message: 'Missing id or itemId',
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    const dto = UpdateActivityItemSchema.parse(await req.json());
    const result = await ProjectsService.updateActivityItem(id, itemId, ctx.session!.id, dto);
    return v1Ok(result);
  } catch (err) {
    log.error('v1UpdateActivityItem', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1RemoveActivityItem = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    const itemId = ctx.params?.itemId;
    if (!id || !itemId) {
      return v1FromApiError({
        message: 'Missing id or itemId',
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    const result = await ProjectsService.removeActivityItem(id, itemId, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1RemoveActivityItem', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1CloseProject = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const result = await ProjectsService.close(id, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1CloseProject', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1ReopenProject = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const result = await ProjectsService.reopen(id, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1ReopenProject', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
