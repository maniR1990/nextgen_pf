import type { ZodSchema } from 'zod';
import { ValidationError } from '../errors';
import { error } from '../response';
import type { Middleware } from './types';

export function withValidation<T>(schema: ZodSchema<T>): Middleware {
  return (handler) => async (req, ctx) => {
    try {
      const body = await req.json();
      const parsed = schema.parse(body);
      const validatedReq = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(parsed),
      });
      return handler(validatedReq, ctx);
    } catch (err) {
      if (err && typeof err === 'object' && 'issues' in err) {
        return error(new ValidationError('Invalid input', err));
      }
      return error(new ValidationError());
    }
  };
}
