'use client';

import { Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { AuthFormFooter } from '@/components/ui/AuthFormFooter';
import { AuthFormHeader } from '@/components/ui/AuthFormHeader';
import { Button } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import { AUTH_MESSAGES } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';
import { parseClientError } from '@/lib/api/parseClientError';

type VerifyState = 'loading' | 'success' | 'error';

export function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, setState] = useState<VerifyState>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(
    token ? '' : AUTH_MESSAGES.verifyLinkExpired,
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function verify() {
      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
        credentials: 'include',
      });

      if (cancelled) return;

      if (res.ok) {
        setState('success');
        setMessage('Email verified successfully. Redirecting…');
        router.replace(ROUTES.DASHBOARD);
        return;
      }

      const apiError = await parseClientError(res);
      setState('error');
      setMessage(apiError.message);
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (state === 'loading') {
    return (
      <div className="auth-form">
        <AuthFormHeader title="Verifying email" icon={Mail} />
        <p className="auth-status-body">Please wait while we confirm your email address…</p>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="auth-form">
        <AuthFormHeader title="Email verified" icon={Mail} iconTone="success" />
        <Alert variant="success">{message}</Alert>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <AuthFormHeader title="Verification failed" icon={Mail} iconTone="error" />
      <Alert variant="error">{message || AUTH_MESSAGES.verifyLinkExpired}</Alert>
      <Button type="button" onClick={() => router.push(ROUTES.LOGIN)}>
        Back to login
      </Button>
      <AuthFormFooter>
        Need a new link? <TextLink href={ROUTES.REGISTER}>Create account</TextLink>
      </AuthFormFooter>
    </div>
  );
}
