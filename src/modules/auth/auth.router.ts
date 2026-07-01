import { AUTH } from '@/constants/auth';
import { UnauthorizedError, ValidationError, isApiError } from '@/lib/api/errors';
import { compose, withRequestLogging, withValidation } from '@/lib/api/middleware';
import { withRateLimit } from '@/lib/api/middleware/withRateLimit';
import { v1Created, v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { getCookie, withClearedSessionCookies, withSessionCookies } from '@/lib/auth/cookies';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/auth/jwt';
import { getLogger } from '@/lib/logger';
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResendVerificationSchema,
  ResetPasswordSchema,
} from './auth.schema';
import { AuthService } from './auth.service';

const log = getLogger('AuthRouter');

const withAuthRoute = (...middlewares: Parameters<typeof compose>) =>
  compose(withRequestLogging('auth-api'), ...middlewares);

// 5 attempts per 15 min for credential endpoints; stricter than the default
const withStrictLimit = () => withRateLimit({ max: 5, window: '15m' });
const withModerateLimit = () => withRateLimit({ max: 10, window: '15m' });

export const handleRegister = withAuthRoute(
  withStrictLimit(),
  withValidation(RegisterSchema),
)(async (req) => {
  try {
    const body = await req.json();
    const result = await AuthService.register(body);
    return v1Created(result);
  } catch (err) {
    log.error('register', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const handleLogin = withAuthRoute(
  withStrictLimit(),
  withValidation(LoginSchema),
)(async (req) => {
  try {
    const body = await req.json();
    const { user, tokens } = await AuthService.login(body);
    const res = v1Ok({ user });
    return withSessionCookies(res, tokens.accessToken, tokens.refreshToken);
  } catch (err) {
    log.error('login', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export async function handleRefresh(req: Request) {
  const rateLimited = withRateLimit({ max: 20, window: '15m' })(async (r: Request) => {
    try {
      const refreshToken = getCookie(r, AUTH.COOKIE_REFRESH);
      if (!refreshToken) return v1FromApiError(new UnauthorizedError());
      const { user, tokens } = await AuthService.refresh(refreshToken);
      const res = v1Ok({ user });
      return withSessionCookies(res, tokens.accessToken, tokens.refreshToken);
    } catch (err) {
      log.error('refresh', { err });
      if (isApiError(err)) return v1FromApiError(err);
      throw err;
    }
  });
  return rateLimited(req, {});
}

export async function handleLogout(req: Request) {
  try {
    const accessToken = getCookie(req, AUTH.COOKIE_ACCESS);
    const refreshToken = getCookie(req, AUTH.COOKIE_REFRESH);

    let accessJti: string | undefined;
    let refreshJti: string | undefined;

    if (accessToken) {
      try {
        accessJti = (await verifyAccessToken(accessToken)).jti;
      } catch {
        /* expired access token is fine on logout */
      }
    }

    if (refreshToken) {
      try {
        refreshJti = (await verifyRefreshToken(refreshToken)).jti;
      } catch {
        /* ignore */
      }
    }

    await AuthService.logout(accessJti, refreshJti);
    return withClearedSessionCookies(v1Ok({ message: 'Logged out' }));
  } catch (err) {
    log.error('logout', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
}

export async function handleMe(_req: Request, ctx: { session?: { id: string } }) {
  try {
    const user = await AuthService.me(ctx.session!.id);
    return v1Ok({ user });
  } catch (err) {
    log.error('me', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
}

export const handleForgotPassword = withAuthRoute(
  withStrictLimit(),
  withValidation(ForgotPasswordSchema),
)(async (req) => {
  try {
    const body = await req.json();
    const result = await AuthService.forgotPassword(body);
    return v1Ok(result);
  } catch (err) {
    log.error('forgotPassword', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export async function handleValidateResetToken(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get('token');
    if (!token) return v1FromApiError(new ValidationError());
    const result = await AuthService.validateResetToken(token);
    return v1Ok(result);
  } catch (err) {
    log.error('validateResetToken', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
}

export const handleResetPassword = withAuthRoute(
  withStrictLimit(),
  withValidation(ResetPasswordSchema),
)(async (req) => {
  try {
    const body = await req.json();
    const { user, tokens } = await AuthService.resetPassword(body);
    const res = v1Ok({ user });
    return withSessionCookies(res, tokens.accessToken, tokens.refreshToken);
  } catch (err) {
    log.error('resetPassword', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const handleResendVerification = withAuthRoute(
  withModerateLimit(),
  withValidation(ResendVerificationSchema),
)(async (req) => {
  try {
    const body = await req.json();
    const result = await AuthService.resendVerification(body);
    return v1Ok(result);
  } catch (err) {
    log.error('resendVerification', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export async function handleVerifyEmail(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get('token');
    if (!token) return v1FromApiError(new ValidationError());
    const user = await AuthService.verifyEmail(token);
    const tokens = await AuthService.issueTokensForUser(user);
    const res = v1Ok({ user, message: 'Email verified' });
    return withSessionCookies(res, tokens.accessToken, tokens.refreshToken);
  } catch (err) {
    log.error('verifyEmail', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
}
