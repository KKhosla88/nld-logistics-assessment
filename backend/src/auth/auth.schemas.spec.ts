import { registerSchema } from './auth.schemas';

describe('authentication request schemas', () => {
  it('accepts the assessment registration contract', () => {
    expect(registerSchema.safeParse({ body: {
      email: 'test@example.com',
      password: 'Pwd@123',
      role: 'USER'
    } }).success).toBe(true);
  });

  it('rejects passwords shorter than six characters', () => {
    expect(registerSchema.safeParse({ body: {
      email: 'test@example.com',
      password: '12345',
      role: 'USER'
    } }).success).toBe(false);
  });

  it('rejects roles outside ADMIN and USER', () => {
    expect(registerSchema.safeParse({ body: {
      email: 'test@example.com',
      password: 'Pwd@123',
      role: 'MANAGER'
    } }).success).toBe(false);
  });
});
