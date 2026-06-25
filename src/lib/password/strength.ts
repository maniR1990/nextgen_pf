export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  label: string;
  filledSegments: number;
}

const LABELS: Record<PasswordStrengthLevel, string> = {
  0: '',
  1: 'Too weak',
  2: 'Fair — add uppercase and numbers',
  3: 'Good — add symbols for extra strength',
  4: 'Strong — mix of uppercase, numbers & symbols',
};

/** Client-side strength meter aligned with RegisterSchema password rules. */
export function scorePassword(password: string): PasswordStrengthResult {
  if (!password) {
    return { level: 0, label: LABELS[0], filledSegments: 0 };
  }

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  let level: PasswordStrengthLevel = 1;
  if (hasMinLength) level = 2;
  if (hasMinLength && hasUpper && hasNumber) level = 3;
  if (hasMinLength && hasUpper && hasNumber && (hasSymbol || password.length >= 12)) level = 4;

  return {
    level,
    label: LABELS[level],
    filledSegments: level,
  };
}
