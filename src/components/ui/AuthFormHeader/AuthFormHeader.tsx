import type { ReactNode } from 'react';
import { Icon, type IconTone } from '@/components/ui/Icon';
import type { LucideIcon } from 'lucide-react';

export interface AuthFormHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconTone?: IconTone;
  trailing?: ReactNode;
}

export function AuthFormHeader({ title, subtitle, icon, iconTone = 'brand', trailing }: AuthFormHeaderProps) {
  return (
    <header className="auth-form-header">
      {icon ? (
        <div className="auth-form-header__icon-wrap">
          <Icon icon={icon} size="lg" tone={iconTone} aria-hidden />
        </div>
      ) : null}
      <h1 className="auth-form-header__title">{title}</h1>
      {subtitle ? <p className="auth-form-header__subtitle">{subtitle}</p> : null}
      {trailing}
    </header>
  );
}
