import 'reflect-metadata';

import { createServer } from 'node:http';

import { app } from './app';
import { env } from './config/env';
import { AppDataSource } from './database/data-source';

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();

  const server = createServer(app);

  server.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });

  let shuttingDown = false;

  const shutdown = (signal: NodeJS.Signals): void => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`${signal} received. Shutting down gracefully.`);

    server.close(async (error) => {
      try {
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
        }
      } finally {
        process.exit(error ? 1 : 0);
      }
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start API.', error);
  process.exit(1);
});

