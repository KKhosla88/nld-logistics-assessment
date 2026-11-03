import request from 'supertest';

jest.mock('./database/data-source', () => ({
  AppDataSource: {
    isInitialized: true,
    query: jest.fn().mockResolvedValue([{ '?column?': 1 }])
  }
}));

import { app } from './app';

describe('Express application', () => {
  it('reports application and database health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'connected' });
  });

  it('returns a consistent JSON response for unknown routes', async () => {
    const response = await request(app).get('/not-a-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { message: 'Route not found' } });
  });
});

