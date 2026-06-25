'use client';

import { scorePassword, type PasswordStrengthLevel } from '@/lib/password/strength';

export interface PasswordStrengthMeterProps {
  password: string;
  segmentCount?: number;
}

const SEGMENT_TONE: Record<PasswordStrengthLevel, string> = {
  0: '',
  1: 'password-strength__segment--weak',
  2: 'password-strength__segment--fair',
  3: 'password-strength__segment--good',
  4: 'password-strength__segment--strong',
};

export function PasswordStrengthMeter({ password, segmentCount = 4 }: PasswordStrengthMeterProps) {
  const { level, label, filledSegments } = scorePassword(password);

  if (!password) return null;

  return (
    <div className="password-strength" aria-live="polite">
      <div
        className="password-strength__segments"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={segmentCount}
        aria-valuenow={filledSegments}
        aria-label="Password strength"
      >
        {Array.from({ length: segmentCount }, (_, index) => {
          const active = index < filledSegments;
          const tone = active ? SEGMENT_TONE[level] : '';
          return (
            <span
              key={index}
              className={['password-strength__segment', active && tone].filter(Boolean).join(' ')}
            />
          );
        })}
      </div>
      {label ? <p className="password-strength__label">{label}</p> : null}
    </div>
  );
}
