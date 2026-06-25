/** Client-visible OAuth toggles — set on Vercel when provider credentials are configured. */
export const OAUTH = {
  GOOGLE_ENABLED: process.env.NEXT_PUBLIC_OAUTH_GOOGLE === 'true',
  GITHUB_ENABLED: process.env.NEXT_PUBLIC_OAUTH_GITHUB === 'true',
} as const;

export type OAuthProviderId = 'google' | 'github';

export function getEnabledOAuthProviders(): OAuthProviderId[] {
  const providers: OAuthProviderId[] = [];
  if (OAUTH.GOOGLE_ENABLED) providers.push('google');
  if (OAUTH.GITHUB_ENABLED) providers.push('github');
  return providers;
}
