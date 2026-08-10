import type { ZodSchema } from 'zod';
import { ValidationError } from '../errors';
import { error } from '../response';
import type { Middleware } from './types';

export function withValidation<T>(schema: ZodSchema<T>): Middleware {
  return (handler) => async (req, ctx) => {
    // Only body parsing + schema validation belong inside this try — the downstream
    // handler call must run outside it. `return handler(...)` returns a promise; without
    // an `await`, this catch never actually observed its rejection (a `try { return
    // promise } catch {}` doesn't catch a later rejection of that promise), so business-
    // logic errors were silently reclassified as a bare "Invalid input" 422 by whichever
    // layer NEXT happened to await it — see withAuth.ts for the matching half of this bug.
    let validatedReq: Request;
    try {
      const body = await req.json();
      const parsed = schema.parse(body);
      validatedReq = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(parsed),
      });
    } catch (err) {
      if (err && typeof err === 'object' && 'issues' in err) {
        return error(new ValidationError('Invalid input', err));
      }
      return error(new ValidationError());
    }
    return handler(validatedReq, ctx);
  };
}
