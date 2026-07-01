export const AUTH = {
  BCRYPT_ROUNDS: 12,
  ACCESS_TOKEN_TTL_SEC: 15 * 60,
  REFRESH_TOKEN_TTL_SEC: 7 * 24 * 60 * 60,
  RESET_TOKEN_TTL_MS: 60 * 60 * 1000,
  VERIFY_TOKEN_TTL_MS: 24 * 60 * 60 * 1000,
  LOCKOUT_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,
  COOKIE_ACCESS: 'access_token',
  COOKIE_REFRESH: 'refresh_token',
  COOKIE_LAST_ACTIVE: 'last_active',
  INACTIVITY_TIMEOUT_SEC: 30 * 60, // 30 minutes
} as const;

export const AUTH_MESSAGES = {
  invalidCredentials: 'Invalid email or password. Please try again.',
  checkEmail: 'If this email is registered, you will receive further instructions.',
  registrationSuccess: 'Check your email to verify your account.',
  registrationReady: 'Account created. You can sign in now.',
  emailNotVerified: 'Email not verified. Please check your inbox or resend verification.',
  verificationSent: 'Verification email sent successfully',
  resetLinkSent: 'If an account exists for that email, a reset link has been sent.',
  resetTokenExpired: 'This reset link has expired. Request a new one.',
  verifyLinkExpired: 'This verification link is invalid or has expired.',
} as const;

export const AUTH_UI = {
  VERIFY_LINK_EXPIRY_HOURS: 24,
  RESET_LINK_EXPIRY_HOURS: 1,
} as const;
