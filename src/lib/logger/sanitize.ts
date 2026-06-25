const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'secret',
]);

export function sanitizeContext(
  context?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!context) return undefined;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEYS.has(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    if (key === 'email' && typeof value === 'string') {
      const [local, domain] = value.split('@');
      sanitized[key] = local && domain ? `${local[0]}***@${domain}` : '[REDACTED]';
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeContext(value as Record<string, unknown>);
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}
