import { getLogger } from '@/lib/logger';

const log = getLogger('Email');

type AuthEmailType = 'verification' | 'password-reset';

/** Logs auth links — no external email service required for personal deploys. */
export async function sendAuthEmail(params: {
  type: AuthEmailType;
  to: string;
  token: string;
  name: string;
}) {
  const base = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const path =
    params.type === 'verification'
      ? `/verify-email?token=${encodeURIComponent(params.token)}`
      : `/reset-password?token=${encodeURIComponent(params.token)}`;

  log.info('auth.email.link', {
    type: params.type,
    to: params.to,
    url: `${base}${path}`,
  });
}
