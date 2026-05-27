import type { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { badRequest } from '../lib/httpError.js';

type Source = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, source: Source = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(badRequest('Validation failed', result.error.flatten()));
    }
    // Replace the source with the parsed (and possibly coerced) data.
    (req as unknown as Record<Source, unknown>)[source] = result.data;
    next();
  };
