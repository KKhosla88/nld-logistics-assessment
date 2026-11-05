import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

jest.mock('../database/data-source', () => ({ AppDataSource: { getRepository: jest.fn() } }));

import { env } from '../config/env';
import { AppDataSource } from '../database/data-source';
import { UserAccess, UserRole } from '../database/entities/enums';
import { errorHandler } from './error.middleware';
import { authenticate, authorize } from './auth.middleware';

const createApp = (requireCreate = false) => {
  const app = express();
  app.get('/protected', authenticate, ...(requireCreate ? [authorize({ accesses: [UserAccess.CREATE] })] : []), (_request, response) => response.json({ ok: true }));
  app.use(errorHandler);
  return app;
};

const tokenFor = (access: UserAccess) => jwt.sign(
  { id: 1, role: UserRole.USER, access },
  env.JWT_SECRET,
  { expiresIn: '1h' }
);

describe('authentication and authorization middleware', () => {
  beforeEach(() => {
    (AppDataSource.getRepository as jest.Mock).mockReturnValue({
      findOneBy: jest.fn().mockResolvedValue({ id: 1, role: UserRole.USER, access: UserAccess.VIEW })
    });
  });

  it('rejects a request without a bearer token', async () => {
    expect((await request(createApp()).get('/protected')).status).toBe(401);
  });

  it('accepts a valid token', async () => {
    const response = await request(createApp()).get('/protected').set('Authorization', `Bearer ${tokenFor(UserAccess.VIEW)}`);
    expect(response.status).toBe(200);
  });

  it('denies VIEW access when CREATE is required', async () => {
    const response = await request(createApp(true)).get('/protected').set('Authorization', `Bearer ${tokenFor(UserAccess.VIEW)}`);
    expect(response.status).toBe(403);
  });

  it('uses current database access instead of stale token access', async () => {
    (AppDataSource.getRepository as jest.Mock).mockReturnValue({
      findOneBy: jest.fn().mockResolvedValue({ id: 1, role: UserRole.USER, access: UserAccess.CREATE })
    });
    const response = await request(createApp(true)).get('/protected').set('Authorization', `Bearer ${tokenFor(UserAccess.VIEW)}`);
    expect(response.status).toBe(200);
  });

  it('rejects a valid token when its account has been deleted', async () => {
    (AppDataSource.getRepository as jest.Mock).mockReturnValue({ findOneBy: jest.fn().mockResolvedValue(null) });
    const response = await request(createApp()).get('/protected').set('Authorization', `Bearer ${tokenFor(UserAccess.VIEW)}`);
    expect(response.status).toBe(401);
  });
});
