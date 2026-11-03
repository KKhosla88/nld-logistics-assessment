import type { Request } from 'express';

import type { UserAccess, UserRole } from '../database/entities/enums';

export interface AuthenticatedUser {
  id: number;
  role: UserRole;
  access: UserAccess;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

