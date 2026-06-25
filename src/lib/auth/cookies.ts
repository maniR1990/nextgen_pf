import { AUTH } from '@/constants/auth';

const isProd = process.env.NODE_ENV === 'production';

function cookieOptions(maxAgeSec: number) {
  return [
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    isProd ? 'Secure' : '',
    `Max-Age=${maxAgeSec}`,
  ]
    .filter(Boolean)
    .join('; ');
}

export function buildSessionCookies(accessToken: string, refreshToken: string) {
  return [
    `${AUTH.COOKIE_ACCESS}=${accessToken}; ${cookieOptions(AUTH.ACCESS_TOKEN_TTL_SEC)}`,
    `${AUTH.COOKIE_REFRESH}=${refreshToken}; ${cookieOptions(AUTH.REFRESH_TOKEN_TTL_SEC)}`,
  ];
}

export function buildClearSessionCookies() {
  return [
    `${AUTH.COOKIE_ACCESS}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
    `${AUTH.COOKIE_REFRESH}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
  ];
}

export function getCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get('cookie');
  if (!header) return undefined;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

export function withSessionCookies(response: Response, accessToken: string, refreshToken: string) {
  const headers = new Headers(response.headers);
  for (const cookie of buildSessionCookies(accessToken, refreshToken)) {
    headers.append('Set-Cookie', cookie);
  }
  return new Response(response.body, { status: response.status, headers });
}

export function withClearedSessionCookies(response: Response) {
  const headers = new Headers(response.headers);
  for (const cookie of buildClearSessionCookies()) {
    headers.append('Set-Cookie', cookie);
  }
  return new Response(response.body, { status: response.status, headers });
}
