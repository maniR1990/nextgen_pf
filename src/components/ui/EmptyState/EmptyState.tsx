'use client';

import { Button } from '@/components/ui/Button';
import { Icon, type IconTone } from '@/components/ui/Icon';
import {
  EMPTY_STATE_DEFAULT_ICON_TONE,
  EMPTY_STATE_DEFAULT_SIZE,
  type EmptyStateSize,
} from '@/constants/emptyState';
import { Inbox, type LucideIcon } from 'lucide-react';
import type { HTMLAttributes } from 'react';

const SIZE_CLASS: Record<EmptyStateSize, string | null> = {
  sm: 'empty-state--sm',
  md: null,
  lg: 'empty-state--lg',
};

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  iconTone?: IconTone;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: EmptyStateSize;
}

export function emptyStateClassName({
  size = EMPTY_STATE_DEFAULT_SIZE,
  className = '',
}: {
  size?: EmptyStateSize;
  className?: string;
}) {
  return ['empty-state', SIZE_CLASS[size], className].filter(Boolean).join(' ');
}

export function EmptyState({
  icon = Inbox,
  iconTone = EMPTY_STATE_DEFAULT_ICON_TONE,
  title,
  description,
  actionLabel,
  onAction,
  size = EMPTY_STATE_DEFAULT_SIZE,
  className = '',
  ...props
}: EmptyStateProps) {
  const showAction = Boolean(actionLabel && onAction);

  return (
    <div className={emptyStateClassName({ size, className })} {...props}>
      <Icon icon={icon} size="xl" tone={iconTone} className="empty-state__icon" />
      <h3 className="empty-state__title">{title}</h3>
      {description ? <p className="empty-state__description">{description}</p> : null}
      {showAction ? (
        <Button variant="primary" onClick={onAction} className="empty-state__action">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
