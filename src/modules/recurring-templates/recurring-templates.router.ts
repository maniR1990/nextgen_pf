import { isApiError } from '@/lib/api/errors';
import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { v1Created, v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import {
  CreateRecurringTemplateSchema,
  PatchRecurringTemplateSchema,
  PreviewOccurrencesSchema,
} from './recurring-templates.schema';
import { RecurringTemplatesService } from './recurring-templates.service';

const log = getLogger('RecurringTemplatesRouter');

export const v1ListTemplates = compose(withAuth())(async (_req, ctx) => {
  try {
    const rows = await RecurringTemplatesService.list(ctx.session!.id);
    return v1Ok(rows);
  } catch (err) {
    log.error('v1ListTemplates', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1CreateTemplate = compose(
  withAuth(),
  withValidation(CreateRecurringTemplateSchema),
)(async (req, ctx) => {
  try {
    const body = await req.json();
    const dto = CreateRecurringTemplateSchema.parse(body);
    const template = await RecurringTemplatesService.create(ctx.session!.id, dto);
    return v1Created(template);
  } catch (err) {
    log.error('v1CreateTemplate', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1UpdateTemplate = compose(
  withAuth(),
  withValidation(PatchRecurringTemplateSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id)
      return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
    const body = await req.json();
    const dto = PatchRecurringTemplateSchema.parse(body);
    const template = await RecurringTemplatesService.update(id, ctx.session!.id, dto);
    return v1Ok(template);
  } catch (err) {
    log.error('v1UpdateTemplate', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1PreviewOccurrences = compose(
  withAuth(),
  withValidation(PreviewOccurrencesSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id)
      return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
    const body = await req.json().catch(() => ({}));
    const { count } = PreviewOccurrencesSchema.parse(body);
    const result = await RecurringTemplatesService.previewOccurrences(id, ctx.session!.id, count);
    return v1Ok(result);
  } catch (err) {
    log.error('v1PreviewOccurrences', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1GenerateOccurrence = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id)
      return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
    const result = await RecurringTemplatesService.generate(id, ctx.session!.id);
    return v1Created(result);
  } catch (err) {
    log.error('v1GenerateOccurrence', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
