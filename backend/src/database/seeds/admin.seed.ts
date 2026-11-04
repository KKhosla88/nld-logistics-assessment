import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AppDataSource } from '../data-source';
import { UserAccess, UserRole } from '../entities/enums';
import { User } from '../entities/user.entity';

const config = z.object({
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(12).max(72)
}).parse(process.env);

async function seedAdmin(): Promise<void> {
  await AppDataSource.initialize();
  try {
    const repository = AppDataSource.getRepository(User);
    const existing = await repository.findOne({ where: { email: config.ADMIN_EMAIL.toLowerCase() } });
    const admin = existing ?? repository.create({ email: config.ADMIN_EMAIL.toLowerCase() });
    admin.passwordHash = await bcrypt.hash(config.ADMIN_PASSWORD, 12);
    admin.role = UserRole.ADMIN;
    admin.access = UserAccess.CREATE;
    await repository.save(admin);
    console.log(`Admin account ready: ${admin.email}`);
  } finally { await AppDataSource.destroy(); }
}

seedAdmin().catch((error: unknown) => { console.error('Admin seed failed.', error); process.exitCode = 1; });

