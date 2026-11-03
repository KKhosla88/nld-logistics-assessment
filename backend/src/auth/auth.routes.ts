import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { QueryFailedError } from 'typeorm';

import { env } from '../config/env';
import { UserAccess, UserRole } from '../database/entities/enums';
import { User } from '../database/entities/user.entity';
import { AppDataSource } from '../database/data-source';
import { validate } from '../middleware/validate.middleware';
import { HttpError } from '../types/http-error';
import { loginSchema, registerSchema } from './auth.schemas';

export const authRouter = Router();

const publicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  access: user.access,
  createdAt: user.createdAt
});

const createToken = (user: User): string => jwt.sign(
  { id: user.id, role: user.role, access: user.access },
  env.JWT_SECRET,
  { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'], subject: String(user.id) }
);

authRouter.post('/register', validate(registerSchema), async (request, response, next) => {
  try {
    const { email, password } = registerSchema.shape.body.parse(request.body);
    const repository = AppDataSource.getRepository(User);
    if (await repository.exists({ where: { email } })) {
      throw new HttpError(409, 'An account with this email already exists');
    }

    const user = repository.create({
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: UserRole.USER,
      access: UserAccess.VIEW
    });
    await repository.save(user);
    response.status(201).json({ user: publicUser(user) });
  } catch (error: unknown) {
    if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505') {
      next(new HttpError(409, 'An account with this email already exists'));
      return;
    }
    next(error);
  }
});

authRouter.post('/login', validate(loginSchema), async (request, response, next) => {
  try {
    const { email, password } = loginSchema.shape.body.parse(request.body);
    const user = await AppDataSource.getRepository(User).findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, 'Invalid email or password');
    }
    response.json({ token: createToken(user), user: publicUser(user) });
  } catch (error: unknown) {
    next(error);
  }
});

