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

export const adminRouter = Router();
adminRouter.use(authenticate, authorize({ roles: [UserRole.ADMIN] }));

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

