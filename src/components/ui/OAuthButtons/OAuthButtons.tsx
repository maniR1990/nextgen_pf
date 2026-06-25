'use client';

import { Button } from '@/components/ui/Button';
import { type OAuthProviderId, getEnabledOAuthProviders } from '@/constants/oauth';
import { signIn } from 'next-auth/react';

const OAUTH_CALLBACK = '/api/auth/oauth/complete';

const LABELS: Record<OAuthProviderId, string> = {
  google: 'Continue with Google',
  github: 'Continue with GitHub',
};

export function OAuthButtons() {
  const providers = getEnabledOAuthProviders();

  if (providers.length === 0) return null;

  return (
    <div className="oauth-buttons">
      {providers.map((provider) => (
        <Button
          key={provider}
          type="button"
          variant="secondary"
          onClick={() => signIn(provider, { callbackUrl: OAUTH_CALLBACK })}
        >
          {LABELS[provider]}
        </Button>
      ))}
    </div>
  );
}
