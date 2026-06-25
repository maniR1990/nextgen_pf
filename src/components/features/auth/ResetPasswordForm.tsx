'use client';

import { Alert } from '@/components/ui/Alert';
import { AuthFormHeader } from '@/components/ui/AuthFormHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { AUTH_MESSAGES, AUTH_UI } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';
import { parseClientError } from '@/lib/api/parseClientError';
import { ResetPasswordSchema } from '@/modules/auth/auth.schema';
import { Lock } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function validate() {
      const res = await fetch(`/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`);
      if (!cancelled) setTokenValid(res.ok);
    }
    validate();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});

    const parsed = ResetPasswordSchema.safeParse({
      token,
      newPassword,
      confirmPassword,
    });

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
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(parsed.data),
    });
    setLoading(false);

    if (!res.ok) {
      const apiError = await parseClientError(res);
      setFormError(apiError.message);
      return;
    }

    router.push(ROUTES.DASHBOARD);
  }

  if (tokenValid === null) {
    return <p className="auth-status-body">Validating reset link…</p>;
  }

  if (!tokenValid) {
    return (
      <div className="auth-form">
        <AuthFormHeader title="Link expired" icon={Lock} iconTone="error" />
        <Alert variant="error">{AUTH_MESSAGES.resetTokenExpired}</Alert>
        <Button type="button" onClick={() => router.push(ROUTES.FORGOT_PASSWORD as Route)}>
          Request new link
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <AuthFormHeader
        title="Set new password"
        subtitle="Must be at least 8 characters"
        icon={Lock}
        iconTone="warning"
      />

      {formError ? <Alert variant="error">{formError}</Alert> : null}

      <div>
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={fieldErrors.newPassword}
          invalid={Boolean(fieldErrors.newPassword)}
        />
        <PasswordStrengthMeter password={newPassword} />
      </div>
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={fieldErrors.confirmPassword}
        invalid={Boolean(fieldErrors.confirmPassword)}
      />

      <Button type="submit" loading={loading}>
        Reset password
      </Button>

      <p className="auth-status-meta">Token expires in {AUTH_UI.RESET_LINK_EXPIRY_HOURS} hour</p>
    </form>
  );
}
