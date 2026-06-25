import { VerifyEmailClient } from '@/components/features/auth/VerifyEmailClient';
import { Suspense } from 'react';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="auth-status-body">Loading…</p>}>
      <VerifyEmailClient />
    </Suspense>
  );
}
