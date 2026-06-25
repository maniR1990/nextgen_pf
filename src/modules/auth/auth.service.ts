import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { AUTH, AUTH_MESSAGES } from '@/constants/auth';
import {
  ConflictError,
  ForbiddenError,
  GoneError,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/api/errors';
import { generateSecureToken } from '@/lib/auth/tokens';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import {
  blacklistAccessToken,
  getRefreshTokenUserId,
  revokeRefreshToken,
  storeRefreshToken,
} from '@/lib/auth/sessionStore';
import { sendAuthEmail } from '@/lib/email/sendAuthEmail';
import { getLogger } from '@/lib/logger';
import { UserRepository } from '@/modules/users/users.repository';
import { prisma } from '@/lib/db/prisma';
import { AuthRepository } from './auth.repository';
import type {
  AuthTokens,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  SessionUserDto,
} from './auth.types';

// Valid bcrypt hash used for constant-time compare when user not found
const DUMMY_HASH = '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW';
const log = getLogger('AuthService');

function toSessionUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: Date | null;
}): SessionUserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}

async function issueTokens(user: SessionUserDto): Promise<AuthTokens> {
  const { token: accessToken, jti: accessJti } = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const { token: refreshToken, jti: refreshJti } = await signRefreshToken(user.id);
  await storeRefreshToken(refreshJti, user.id);
  return { accessToken, refreshToken, accessJti, refreshJti };
}

export const AuthService = {
  async register(dto: RegisterDto) {
    const existing = await UserRepository.findByEmail(dto.email);
    if (existing) throw new ConflictError('Email already exists');

    const passwordHash = await bcrypt.hash(dto.password, AUTH.BCRYPT_ROUNDS);

    try {
      const autoVerify = process.env.AUTO_VERIFY_EMAIL === 'true';
      const user = await UserRepository.create({
        email: dto.email,
        name: dto.name,
        passwordHash,
        emailVerified: autoVerify ? new Date() : null,
      });

      await prisma.accountGroup.createMany({
        data: [
          { name: 'Cash & Bank',  slug: 'cash-bank',   type: 'ASSET',     order: 1, userId: user.id, isDefault: true },
          { name: 'Investments',  slug: 'investments',  type: 'ASSET',     order: 2, userId: user.id, isDefault: true },
          { name: 'Credit Cards', slug: 'credit-cards', type: 'LIABILITY', order: 3, userId: user.id, isDefault: true },
          { name: 'Loans',        slug: 'loans',        type: 'LIABILITY', order: 4, userId: user.id, isDefault: true },
        ],
      });

      if (!autoVerify) {
        const token = generateSecureToken();
        const expiresAt = new Date(Date.now() + AUTH.VERIFY_TOKEN_TTL_MS);
        await AuthRepository.deleteVerificationTokensByUserId(user.id);
        await AuthRepository.createVerificationToken(user.id, token, expiresAt);
        await sendAuthEmail({
          type: 'verification',
          to: user.email,
          token,
          name: user.name,
        });
      }

      log.info('auth.register.success', { userId: user.id, email: user.email, action: 'register' });
      return {
        message: autoVerify ? AUTH_MESSAGES.registrationReady : AUTH_MESSAGES.registrationSuccess,
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError('Email already exists');
      }
      throw err;
    }
  },

  async login(dto: LoginDto) {
    const user = await UserRepository.findByEmail(dto.email);

    if (!user || !user.isActive) {
      await bcrypt.compare(dto.password, DUMMY_HASH);
      log.warn('auth.login.failed', { email: dto.email, reason: 'not_found_or_inactive' });
      throw new UnauthorizedError(AUTH_MESSAGES.invalidCredentials);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError(AUTH_MESSAGES.invalidCredentials);
    }

    if (!user.passwordHash) {
      await bcrypt.compare(dto.password, DUMMY_HASH);
      throw new UnauthorizedError(AUTH_MESSAGES.invalidCredentials);
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      const attempts = await AuthRepository.incrementFailedLogin(user.id);
      if (attempts >= AUTH.LOCKOUT_ATTEMPTS) {
        await AuthRepository.lockUser(
          user.id,
          new Date(Date.now() + AUTH.LOCKOUT_DURATION_MS),
        );
        log.warn('auth.login.locked', { userId: user.id, attempts });
      }
      log.warn('auth.login.failed', { userId: user.id, reason: 'invalid_password', attempts });
      throw new UnauthorizedError(AUTH_MESSAGES.invalidCredentials, {
        attemptsRemaining: Math.max(0, AUTH.LOCKOUT_ATTEMPTS - attempts),
      });
    }

    if (!user.emailVerified) {
      log.warn('auth.login.unverified', { userId: user.id, email: user.email });
      throw new ForbiddenError(AUTH_MESSAGES.emailNotVerified, 'EMAIL_NOT_VERIFIED');
    }

    await AuthRepository.resetFailedLogin(user.id);
    const sessionUser = toSessionUser(user);
    const tokens = await issueTokens(sessionUser);
    log.info('auth.login.success', { userId: user.id, action: 'login' });
    return { user: sessionUser, tokens };
  },

  async refresh(refreshToken: string) {
    const { verifyRefreshToken } = await import('@/lib/auth/jwt');
    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const storedUserId = await getRefreshTokenUserId(payload.jti);
    if (!storedUserId || storedUserId !== payload.sub) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    await revokeRefreshToken(payload.jti);

    const user = await UserRepository.findById(payload.sub);
    if (!user.isActive) throw new UnauthorizedError('Invalid refresh token');

    const sessionUser = toSessionUser(user);
    const tokens = await issueTokens(sessionUser);
    log.info('auth.refresh.success', { userId: user.id, action: 'refresh' });
    return { user: sessionUser, tokens };
  },

  async logout(accessJti: string | undefined, refreshJti: string | undefined) {
    if (accessJti) await blacklistAccessToken(accessJti);
    if (refreshJti) await revokeRefreshToken(refreshJti);
    log.info('auth.logout', { action: 'logout' });
  },

  async me(userId: string) {
    const user = await UserRepository.findById(userId);
    return toSessionUser(user);
  },

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await UserRepository.findByEmail(dto.email);
    if (user) {
      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + AUTH.RESET_TOKEN_TTL_MS);
      await AuthRepository.deletePasswordResetTokensByUserId(user.id);
      await AuthRepository.createPasswordResetToken(user.id, token, expiresAt);
      await sendAuthEmail({
        type: 'password-reset',
        to: user.email,
        token,
        name: user.name,
      });
      log.info('auth.forgot_password.sent', {
        userId: user.id,
        email: user.email,
        action: 'forgot-password',
      });
    }
    return { message: AUTH_MESSAGES.checkEmail };
  },

  async validateResetToken(token: string) {
    const record = await AuthRepository.findPasswordResetToken(token);
    if (!record || record.used) throw new NotFoundError('Token not found');
    if (record.expiresAt < new Date()) throw new GoneError('Reset token expired');
    return { valid: true };
  },

  async resetPassword(dto: ResetPasswordDto) {
    const record = await AuthRepository.findPasswordResetToken(dto.token);
    if (!record || record.used) throw new NotFoundError('Token not found');
    if (record.expiresAt < new Date()) throw new GoneError('Reset token expired');

    const passwordHash = await bcrypt.hash(dto.newPassword, AUTH.BCRYPT_ROUNDS);
    await UserRepository.update(record.userId, { passwordHash });
    await AuthRepository.markPasswordResetUsed(record.id);
    await AuthRepository.deletePasswordResetToken(record.id);

    const user = await UserRepository.findById(record.userId);
    const sessionUser = toSessionUser(user);
    const tokens = await issueTokens(sessionUser);
    log.info('auth.reset_password.success', { userId: user.id, action: 'reset-password' });
    return { user: sessionUser, tokens };
  },

  async verifyEmail(token: string) {
    const record = await AuthRepository.findVerificationToken(token);
    if (!record) throw new NotFoundError('Token not found');
    if (record.expiresAt < new Date()) throw new GoneError('Verification token expired');

    await UserRepository.update(record.userId, { emailVerified: new Date() });
    await AuthRepository.deleteVerificationToken(record.id);

    const user = await UserRepository.findById(record.userId);
    log.info('auth.verify_email.success', { userId: user.id, action: 'verify-email' });
    return toSessionUser(user);
  },

  async resendVerification(dto: ResendVerificationDto) {
    const user = await UserRepository.findByEmail(dto.email);
    if (user && !user.emailVerified) {
      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + AUTH.VERIFY_TOKEN_TTL_MS);
      await AuthRepository.deleteVerificationTokensByUserId(user.id);
      await AuthRepository.createVerificationToken(user.id, token, expiresAt);
      await sendAuthEmail({
        type: 'verification',
        to: user.email,
        token,
        name: user.name,
      });
    }
    return { message: AUTH_MESSAGES.checkEmail };
  },

  issueTokensForUser: issueTokens,
  toSessionUser,
};
