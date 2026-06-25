'use client';

import { Alert } from '@/components/ui/Alert';
import { AuthFormFooter } from '@/components/ui/AuthFormFooter';
import { AuthFormHeader } from '@/components/ui/AuthFormHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextLink } from '@/components/ui/TextLink';
import { AUTH_MESSAGES } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';
import { parseClientError } from '@/lib/api/parseClientError';
import { ForgotPasswordSchema } from '@/modules/auth/auth.schema';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setFieldError('');

    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Invalid email');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    setLoading(false);

    if (!res.ok) {
      const apiError = await parseClientError(res);
      setFormError(apiError.message);
      return;
    }

    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <AuthFormHeader
        title="Forgot password?"
        subtitle="Enter your email to receive a reset link"
        icon={KeyRound}
        iconTone="warning"
      />

      {formError ? <Alert variant="error">{formError}</Alert> : null}
      {sent ? <Alert variant="success">{AUTH_MESSAGES.resetLinkSent}</Alert> : null}

      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldError}
        invalid={Boolean(fieldError)}
      />

      <Button type="submit" loading={loading}>
        Send reset link
      </Button>

      <AuthFormFooter>
        <TextLink href={ROUTES.LOGIN}>← Back to login</TextLink>
      </AuthFormFooter>
    </form>
  );
}
