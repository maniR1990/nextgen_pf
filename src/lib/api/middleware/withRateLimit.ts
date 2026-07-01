import { v1FromApiError } from '@/lib/api/v1/envelope';
import { ApiError } from '../errors';
import type { Middleware } from './types';

const store = new Map<string, { count: number; resetAt: number }>();

export function withRateLimit({ max, window }: { max: number; window: string }): Middleware {
  const windowMs = parseWindow(window);

  return (handler) => async (req, ctx) => {
    // Use rightmost trusted IP to prevent X-Forwarded-For spoofing.
    // Attackers can prepend arbitrary IPs; the rightmost value is written
    // by the last trusted proxy and cannot be spoofed by clients.
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',').at(-1)!.trim() : 'unknown';
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return handler(req, ctx);
    }

    if (entry.count >= max) {
      return v1FromApiError(new ApiError('Too many requests', 429, 'RATE_LIMITED'));
    }

    entry.count += 1;
    return handler(req, ctx);
  };
}

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)(m|s|h)$/);
  if (!match) return 60_000;
  const value = Number(match[1]);
  const unit = match[2];
  if (unit === 's') return value * 1_000;
  if (unit === 'h') return value * 3_600_000;
  return value * 60_000;
}
