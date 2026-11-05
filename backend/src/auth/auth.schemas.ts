import { z } from 'zod';
import { UserRole } from '../database/entities/enums';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email().max(320),
    password: z.string().min(6).max(72),
    role: z.nativeEnum(UserRole)
  }).strict()
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email().max(320),
    password: z.string().min(1).max(72)
  }).strict()
});

