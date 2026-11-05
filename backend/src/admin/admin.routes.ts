import { Router } from 'express';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import { UserAccess, UserRole } from '../database/entities/enums';
import { User } from '../database/entities/user.entity';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { HttpError } from '../types/http-error';

const updateAccessSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({ access: z.nativeEnum(UserAccess) }).strict()
});

const listUsersSchema = z.object({
  query: z.object({
    search: z.string().trim().max(100).default(''),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

export const adminRouter = Router();
adminRouter.use(authenticate, authorize({ roles: [UserRole.ADMIN] }));

adminRouter.get('/users', validate(listUsersSchema), async (request, response, next) => {
  try {
    const { search, page, limit } = listUsersSchema.shape.query.parse(request.query);
    const query = AppDataSource.getRepository(User).createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.role', 'user.access', 'user.createdAt'])
      .orderBy('user.createdAt', 'DESC')
      .addOrderBy('user.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) query.where('user.email ILIKE :search', { search: `%${search}%` });
    const [users, total] = await query.getManyAndCount();
    response.json({
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) { next(error); }
});

adminRouter.patch('/users/:id/access', validate(updateAccessSchema), async (request, response, next) => {
  try {
    const { id } = updateAccessSchema.shape.params.parse(request.params);
    const { access } = updateAccessSchema.shape.body.parse(request.body);
    const repository = AppDataSource.getRepository(User);
    const user = await repository.findOne({ where: { id } });
    if (!user) throw new HttpError(404, 'User not found');
    user.access = access;
    await repository.save(user);
    response.json({ user: { id: user.id, email: user.email, role: user.role, access: user.access, createdAt: user.createdAt } });
  } catch (error) { next(error); }
});

