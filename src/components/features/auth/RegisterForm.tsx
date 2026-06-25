'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { AuthDivider } from '@/components/ui/AuthDivider';
import { AuthFormFooter } from '@/components/ui/AuthFormFooter';
import { AuthFormHeader } from '@/components/ui/AuthFormHeader';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { OAuthButtons } from '@/components/ui/OAuthButtons';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { TextLink } from '@/components/ui/TextLink';
import { getEnabledOAuthProviders } from '@/constants/oauth';
import { ROUTES } from '@/constants/routes';
import { parseClientError } from '@/lib/api/parseClientError';
import { RegisterSchema } from '@/modules/auth/auth.schema';
import { VerifyEmailPending } from './VerifyEmailPending';

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const hasOAuth = getEnabledOAuthProviders().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});

    if (!acceptedTerms) {
      setFormError('You must agree to the Terms and Privacy Policy.');
      return;
    }

    const parsed = RegisterSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      setFormError('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/register', {
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

    setSuccessEmail(parsed.data.email);
  }

  if (successEmail) {
    return <VerifyEmailPending email={successEmail} />;
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <AuthFormHeader title="Create account" subtitle="Get started with your free account" />

      {formError ? <Alert variant="error">{formError}</Alert> : null}

      {hasOAuth ? (
        <>
          <OAuthButtons />
          <AuthDivider />
        </>
      ) : null}

      <Input
        label="Full name"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
        invalid={Boolean(fieldErrors.name)}
      />
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        invalid={Boolean(fieldErrors.email)}
      />
      <div>
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          invalid={Boolean(fieldErrors.password)}
        />
        <PasswordStrengthMeter password={password} />
      </div>

      <Checkbox
        checked={acceptedTerms}
        onChange={(e) => setAcceptedTerms(e.target.checked)}
        label="I agree to the Terms and Privacy Policy"
      />

      <Button type="submit" loading={loading}>
        Create account
      </Button>

      <AuthFormFooter>
        Already have an account? <TextLink href={ROUTES.LOGIN}>Sign in</TextLink>
      </AuthFormFooter>
    </form>
  );
}
