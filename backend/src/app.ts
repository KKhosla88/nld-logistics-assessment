import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { authRouter } from './auth/auth.routes';
import { env } from './config/env';
import { AppDataSource } from './database/data-source';
import { errorHandler } from './middleware/error.middleware';
import { productRouter } from './products/product.routes';
import { HttpError } from './types/http-error';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.use('/auth', authRouter);
app.use('/products', productRouter);

app.get('/health', async (_request, response, next) => {
  try {
    if (!AppDataSource.isInitialized) {
      throw new HttpError(503, 'Database is not initialized');
    }

    await AppDataSource.query('SELECT 1');
    response.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error: unknown) {
    next(error instanceof HttpError ? error : new HttpError(503, 'Database is unavailable'));
  }
});

app.use((_request, _response, next) => {
  next(new HttpError(404, 'Route not found'));
});

app.use(errorHandler);

