import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { UserRepository } from '@/modules/users/users.repository';
import { AuthRepository } from './auth.repository';

vi.mock('@/modules/users/users.repository');
vi.mock('./auth.repository');
vi.mock('@/lib/email/sendAuthEmail', () => ({
  sendAuthEmail: vi.fn(),
}));
vi.mock('@/lib/auth/sessionStore', () => ({
  storeRefreshToken: vi.fn(),
  getRefreshTokenUserId: vi.fn(),
  revokeRefreshToken: vi.fn(),
  blacklistAccessToken: vi.fn(),
}));

const baseUser = {
  id: 'u1',
  email: 'a@b.com',
  name: 'Alice',
  passwordHash: '$2a$12$hash',
  role: 'USER' as const,
  emailVerified: new Date(),
  isActive: true,
  failedLoginCount: 0,
  lockedUntil: null,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('register — queues verification email when AUTO_VERIFY_EMAIL is off', async () => {
    vi.stubEnv('AUTO_VERIFY_EMAIL', 'false');
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(UserRepository.create).mockResolvedValue({ ...baseUser, emailVerified: null });
    vi.mocked(AuthRepository.deleteVerificationTokensByUserId).mockResolvedValue({ count: 0 });
    vi.mocked(AuthRepository.createVerificationToken).mockResolvedValue({
      id: 't1',
      token: 'tok',
      userId: 'u1',
      expiresAt: new Date(),
      createdAt: new Date(),
    });

    const result = await AuthService.register({
      email: 'a@b.com',
      name: 'Alice',
      password: 'Password1',
    });

    expect(result.message).toContain('Check your email');
    expect(AuthRepository.createVerificationToken).toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('register — auto-verifies when AUTO_VERIFY_EMAIL is on', async () => {
    vi.stubEnv('AUTO_VERIFY_EMAIL', 'true');
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(UserRepository.create).mockResolvedValue({ ...baseUser, emailVerified: new Date() });

    const result = await AuthService.register({
      email: 'a@b.com',
      name: 'Alice',
      password: 'Password1',
    });

    expect(result.message).toContain('sign in');
    expect(AuthRepository.createVerificationToken).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('forgotPassword — always returns generic message', async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(null);
    const result = await AuthService.forgotPassword({ email: 'missing@b.com' });
    expect(result.message).toBeDefined();
  });

  it('login — rejects unverified email with 403 code', async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue({
      ...baseUser,
      emailVerified: null,
    });
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    await expect(
      AuthService.login({ email: 'a@b.com', password: 'Password1' }),
    ).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
  });
});
