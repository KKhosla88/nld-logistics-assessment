import type { ErrorRequestHandler } from 'express';

import { env } from '../config/env';
import { HttpError } from '../types/http-error';

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      error: {
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    error: {
      message: 'Internal server error',
      ...(env.NODE_ENV === 'development' && error instanceof Error
        ? { details: error.message }
        : {})
    }
  });
};

