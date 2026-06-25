import { SignJWT, jwtVerify } from 'jose';
import { AUTH } from '@/constants/auth';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

function getAccessSecret() {
  return new TextEncoder().encode(
    process.env.JWT_ACCESS_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-access-secret',
  );
}

function getRefreshSecret() {
  return new TextEncoder().encode(
    process.env.JWT_REFRESH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-refresh-secret',
  );
}

export async function signAccessToken(payload: Omit<AccessTokenPayload, 'type' | 'jti'> & { jti?: string }) {
  const jti = payload.jti ?? crypto.randomUUID();
  const token = await new SignJWT({
    email: payload.email,
    role: payload.role,
    jti,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${AUTH.ACCESS_TOKEN_TTL_SEC}s`)
    .setJti(jti)
    .sign(getAccessSecret());

  return { token, jti };
}

export async function signRefreshToken(userId: string, jti = crypto.randomUUID()) {
  const token = await new SignJWT({ type: 'refresh', jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${AUTH.REFRESH_TOKEN_TTL_SEC}s`)
    .setJti(jti)
    .sign(getRefreshSecret());

  return { token, jti };
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getAccessSecret());
  return payload as unknown as AccessTokenPayload & { sub: string };
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  return payload as unknown as RefreshTokenPayload & { sub: string };
}
