'use client';

import { Alert } from '@/components/ui/Alert';
import { AuthFormFooter } from '@/components/ui/AuthFormFooter';
import { AuthFormHeader } from '@/components/ui/AuthFormHeader';
import { Button } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import { AUTH_MESSAGES, AUTH_UI } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';
import { Mail } from 'lucide-react';
import { useState } from 'react';

export interface VerifyEmailPendingProps {
  email: string;
}

export function VerifyEmailPending({ email }: VerifyEmailPendingProps) {
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setResent(true);
  }

  return (
    <div className="auth-form">
      <AuthFormHeader title="Check your email" icon={Mail} iconTone="brand" />
      <p className="auth-status-body">
        We sent a verification link to <strong>{email}</strong>
      </p>
      {resent ? <Alert variant="success" title={AUTH_MESSAGES.verificationSent} /> : null}
      <p className="auth-status-meta">Link expires in {AUTH_UI.VERIFY_LINK_EXPIRY_HOURS} hours</p>
      <Button type="button" variant="secondary" loading={loading} onClick={handleResend}>
        Resend email
      </Button>
      <AuthFormFooter>
        Wrong email? <TextLink href={ROUTES.REGISTER}>Go back</TextLink>
      </AuthFormFooter>
    </div>
  );
}
