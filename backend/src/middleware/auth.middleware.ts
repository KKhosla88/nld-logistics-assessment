import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { UserAccess, UserRole } from '../database/entities/enums';
import { HttpError } from '../types/http-error';
import type { AuthenticatedRequest, AuthenticatedUser } from '../types/authenticated-request';

const isAuthenticatedUser = (value: unknown): value is AuthenticatedUser => {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return typeof payload.id === 'number'
    && Object.values(UserRole).includes(payload.role as UserRole)
    && Object.values(UserAccess).includes(payload.access as UserAccess);
};

export const authenticate: RequestHandler = (request, _response, next) => {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) {
    next(new HttpError(401, 'Authentication required'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (!isAuthenticatedUser(payload)) throw new Error('Invalid token payload');
    (request as AuthenticatedRequest).user = payload;
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
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

