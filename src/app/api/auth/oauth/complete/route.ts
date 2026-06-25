import { ROUTES } from '@/constants/routes';
import { authOptions } from '@/lib/auth/authOptions';
import { buildSessionCookies } from '@/lib/auth/cookies';
import { AuthService } from '@/modules/auth';
import { UserRepository } from '@/modules/users/users.repository';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, baseUrl));
  }

  const user = await UserRepository.findByEmail(session.user.email);
  if (!user) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, baseUrl));
  }

  const sessionUser = AuthService.toSessionUser(user);
  const tokens = await AuthService.issueTokensForUser(sessionUser);
  const redirect = NextResponse.redirect(new URL(ROUTES.DASHBOARD, baseUrl));

  for (const cookie of buildSessionCookies(tokens.accessToken, tokens.refreshToken)) {
    redirect.headers.append('Set-Cookie', cookie);
  }

  return redirect;
}
