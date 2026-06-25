import { AUTH } from '@/constants/auth';

import { isApiError, UnauthorizedError, ValidationError } from '@/lib/api/errors';

import { getCookie, withClearedSessionCookies, withSessionCookies } from '@/lib/auth/cookies';

import { verifyAccessToken, verifyRefreshToken } from '@/lib/auth/jwt';

import { compose, withRequestLogging, withValidation } from '@/lib/api/middleware';

import { created, error, ok } from '@/lib/api/response';

import { AuthService } from './auth.service';

import {

  ForgotPasswordSchema,

  LoginSchema,

  RegisterSchema,

  ResendVerificationSchema,

  ResetPasswordSchema,

} from './auth.schema';



const withAuthRoute = (...middlewares: Parameters<typeof compose>) =>

  compose(withRequestLogging('auth-api'), ...middlewares);



export const handleRegister = withAuthRoute(withValidation(RegisterSchema))(async (req) => {

  try {

    const body = await req.json();

    const result = await AuthService.register(body);

    return created(result);

  } catch (err) {

    if (isApiError(err)) return error(err);

    throw err;

  }

});



export const handleLogin = withAuthRoute(withValidation(LoginSchema))(async (req) => {

  try {

    const body = await req.json();

    const { user, tokens } = await AuthService.login(body);

    const res = ok({ user });

    return withSessionCookies(res, tokens.accessToken, tokens.refreshToken);

  } catch (err) {

    if (isApiError(err)) return error(err);

    throw err;

  }

});



export async function handleRefresh(req: Request) {

  try {

    const refreshToken = getCookie(req, AUTH.COOKIE_REFRESH);

    if (!refreshToken) return error(new UnauthorizedError());



    const { user, tokens } = await AuthService.refresh(refreshToken);

    const res = ok({ user });

    return withSessionCookies(res, tokens.accessToken, tokens.refreshToken);

  } catch (err) {

    if (isApiError(err)) return error(err);

    throw err;

  }

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

    return withClearedSessionCookies(ok({ message: 'Logged out' }));

  } catch (err) {

    if (isApiError(err)) return error(err);

    throw err;

  }

}



export async function handleMe(_req: Request, ctx: { session?: { id: string } }) {

  try {

    const user = await AuthService.me(ctx.session!.id);

    return ok({ user });

  } catch (err) {

    if (isApiError(err)) return error(err);

    throw err;

  }

}



export const handleForgotPassword = withAuthRoute(withValidation(ForgotPasswordSchema))(async (req) => {

  try {

    const body = await req.json();

    const result = await AuthService.forgotPassword(body);

    return ok(result);

  } catch (err) {

    if (isApiError(err)) return error(err);

    throw err;

  }

});



export async function handleValidateResetToken(req: Request) {

  try {

    const token = new URL(req.url).searchParams.get('token');

    if (!token) return error(new ValidationError());

    const result = await AuthService.validateResetToken(token);

    return ok(result);

  } catch (err) {

    if (isApiError(err)) return error(err);

    throw err;

  }

}



export const handleResetPassword = withAuthRoute(withValidation(ResetPasswordSchema))(async (req) => {

  try {

    const body = await req.json();

    const { user, tokens } = await AuthService.resetPassword(body);

    const res = ok({ user });

    return withSessionCookies(res, tokens.accessToken, tokens.refreshToken);

  } catch (err) {

    if (isApiError(err)) return error(err);

    throw err;

  }

});



export const handleResendVerification = withAuthRoute(withValidation(ResendVerificationSchema))(

  async (req) => {

    try {

      const body = await req.json();

      const result = await AuthService.resendVerification(body);

      return ok(result);

    } catch (err) {

      if (isApiError(err)) return error(err);

      throw err;

    }

  },

);



export async function handleVerifyEmail(req: Request) {

  try {

    const token = new URL(req.url).searchParams.get('token');

    if (!token) return error(new ValidationError());

    const user = await AuthService.verifyEmail(token);

    const tokens = await AuthService.issueTokensForUser(user);

    const res = ok({ user, message: 'Email verified' });

    return withSessionCookies(res, tokens.accessToken, tokens.refreshToken);

  } catch (err) {

    if (isApiError(err)) return error(err);

    throw err;

  }

}

