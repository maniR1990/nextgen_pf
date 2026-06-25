import type { ReactNode } from 'react';

type FieldMessageTone = 'hint' | 'error' | 'success';

const TONE_CLASS: Record<FieldMessageTone, string> = {
  hint: 'field-msg--hint',
  error: 'field-msg--error',
  success: 'field-msg--success',
};

function ErrorIcon() {
  return (
    <svg className="field-msg__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.5Zm0 7a.875.875 0 1 1 0-1.75A.875.875 0 0 1 8 11.5Z" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg className="field-msg__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm3.03 4.97a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 1 1 1.06-1.06l.97.97 2.97-2.97a.75.75 0 0 1 1.06 0Z" />
    </svg>
  );
}

export function FieldMessage({
  tone,
  children,
  id,
}: {
  tone: FieldMessageTone;
  children: ReactNode;
  id?: string;
}) {
  return (
    <p id={id} className={['field-msg', TONE_CLASS[tone]].join(' ')}>
      {tone === 'error' && <ErrorIcon />}
      {tone === 'success' && <SuccessIcon />}
      <span>{children}</span>
    </p>
  );
}
