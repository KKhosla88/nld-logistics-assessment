import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { AppDataSource } from '../database/data-source';
import { UserAccess, UserRole } from '../database/entities/enums';
import { User } from '../database/entities/user.entity';
import { HttpError } from '../types/http-error';
import type { AuthenticatedRequest } from '../types/authenticated-request';

const getUserId = (value: unknown): number | null => {
  if (!value || typeof value !== 'object') return null;
  const payload = value as Record<string, unknown>;
  return typeof payload.id === 'number' ? payload.id : null;
};

export const authenticate: RequestHandler = async (request, _response, next) => {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) {
    next(new HttpError(401, 'Authentication required'));
    return;
  }

  let userId: number | null;
  try { userId = getUserId(jwt.verify(token, env.JWT_SECRET)); } catch {
    next(new HttpError(401, 'Invalid or expired token'));
    return;
  }

  if (!userId) { next(new HttpError(401, 'Invalid or expired token')); return; }

  try {
    const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });
    if (!user) { next(new HttpError(401, 'Account no longer exists')); return; }
    (request as AuthenticatedRequest).user = { id: user.id, role: user.role, access: user.access };
    next();
  } catch (error) { next(error); }
};

export const authorize = (options: { roles?: UserRole[]; accesses?: UserAccess[] }): RequestHandler =>
  (request, _response, next) => {
    const { user } = request as AuthenticatedRequest;
    const roleAllowed = !options.roles || options.roles.includes(user.role);
    const accessAllowed = user.role === UserRole.ADMIN
      || !options.accesses
      || options.accesses.includes(user.access);

    if (!roleAllowed || !accessAllowed) {
      next(new HttpError(403, 'You do not have permission to perform this action'));
      return;
    }
    next();
  };

