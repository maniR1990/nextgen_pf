import { Suspense } from 'react';
import { VerifyEmailClient } from '@/components/features/auth/VerifyEmailClient';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="auth-status-body">Loading…</p>}>
      <VerifyEmailClient />
    </Suspense>
  );
}
