import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'default' | 'feature';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

export function cardClassName({
  variant = 'default',
  className = '',
}: {
  variant?: CardVariant;
  className?: string;
}) {
  return ['card', variant === 'feature' && 'card--feature', className].filter(Boolean).join(' ');
}

export function Card({ variant = 'default', children, className = '', ...props }: CardProps) {
  return (
    <div className={cardClassName({ variant, className })} {...props}>
      {children}
    </div>
  );
}
