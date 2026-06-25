import type { Route } from 'next';
import Link from 'next/link';
import type { ComponentProps } from 'react';

export type TextLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
};

export function TextLink({ className = '', href, ...props }: TextLinkProps) {
  return (
    <Link
      className={['text-link', className].filter(Boolean).join(' ')}
      href={href as Route}
      {...props}
    />
  );
}
