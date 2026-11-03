import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

import { HttpError } from '../types/http-error';

export const validate = (schema: ZodType): RequestHandler => (request, _response, next) => {
  const result = schema.safeParse({ body: request.body, query: request.query, params: request.params });
  if (!result.success) {
    next(new HttpError(400, 'Request validation failed', result.error.flatten()));
    return;
  }

  next();
};

