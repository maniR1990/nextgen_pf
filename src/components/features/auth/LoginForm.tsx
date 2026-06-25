'use client';

import { Alert } from '@/components/ui/Alert';
import { AuthDivider } from '@/components/ui/AuthDivider';
import { AuthFormFooter } from '@/components/ui/AuthFormFooter';
import { AuthFormHeader } from '@/components/ui/AuthFormHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OAuthButtons } from '@/components/ui/OAuthButtons';
import { TextLink } from '@/components/ui/TextLink';
import { getEnabledOAuthProviders } from '@/constants/oauth';
import { ROUTES } from '@/constants/routes';
import { parseClientError } from '@/lib/api/parseClientError';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasOAuth = getEnabledOAuthProviders().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    setFieldError('');
    setAttemptsRemaining(null);
    setUnverified(false);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const apiError = await parseClientError(res);
      if (apiError.code === 'EMAIL_NOT_VERIFIED') setUnverified(true);
      setFormError(apiError.message);
      setFieldError(apiError.message);
      if (typeof apiError.details?.attemptsRemaining === 'number') {
        setAttemptsRemaining(apiError.details.attemptsRemaining);
      }
      return;
    }

    router.push(ROUTES.DASHBOARD);
  }

  async function resendVerification() {
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setFormError('');
    setFieldError('');
    setUnverified(false);
  }

  const passwordHint =
    attemptsRemaining !== null && attemptsRemaining > 0
      ? `${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining`
      : undefined;

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <AuthFormHeader title="Welcome back" subtitle="Sign in to your account" />

      {formError ? <Alert variant="error">{formError}</Alert> : null}

      {hasOAuth ? (
        <>
          <OAuthButtons />
          <AuthDivider />
        </>
      ) : null}

      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        invalid={Boolean(fieldError)}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        invalid={Boolean(fieldError)}
        error={passwordHint}
      />

      <div className="auth-form__row-link">
        <TextLink href={ROUTES.FORGOT_PASSWORD}>Forgot password?</TextLink>
      </div>

      {unverified ? (
        <Button type="button" variant="ghost" onClick={resendVerification}>
          Resend verification email
        </Button>
      ) : null}

      <Button type="submit" loading={loading}>
        Sign in
      </Button>

      <AuthFormFooter>
        Don&apos;t have an account? <TextLink href={ROUTES.REGISTER}>Sign up</TextLink>
      </AuthFormFooter>
    </form>
  );
}
