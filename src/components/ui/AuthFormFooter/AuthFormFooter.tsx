import type { ReactNode } from 'react';

export interface AuthFormFooterProps {
  children: ReactNode;
}

export function AuthFormFooter({ children }: AuthFormFooterProps) {
  return <p className="auth-form-footer">{children}</p>;
}
