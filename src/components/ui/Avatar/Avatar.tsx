import { Children, isValidElement } from 'react';
import type { HTMLAttributes, ImgHTMLAttributes, ReactElement, ReactNode } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gray';
export type AvatarShape = 'circle' | 'rounded';
export type AvatarStatus = 'online' | 'offline' | 'away';

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: 'avatar--xs',
  sm: 'avatar--sm',
  md: 'avatar--md',
  lg: 'avatar--lg',
  xl: 'avatar--xl',
};

const COLOR_CLASS: Record<AvatarColor, string> = {
  blue: 'avatar--blue',
  purple: 'avatar--purple',
  green: 'avatar--green',
  orange: 'avatar--orange',
  red: 'avatar--red',
  gray: 'avatar--gray',
};

const STATUS_CLASS: Record<AvatarStatus, string> = {
  online: 'avatar__status--online',
  offline: 'avatar__status--offline',
  away: 'avatar__status--away',
};

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  initials: string;
  size?: AvatarSize;
  color?: AvatarColor;
  shape?: AvatarShape;
  status?: AvatarStatus;
  src?: string;
  alt?: string;
  imgProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>;
}

export function avatarClassName({
  size = 'md',
  color = 'blue',
  shape = 'circle',
  className = '',
}: Pick<AvatarProps, 'size' | 'color' | 'shape' | 'className'>) {
  return [
    'avatar',
    SIZE_CLASS[size],
    COLOR_CLASS[color],
    shape === 'rounded' && 'avatar--rounded',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function Avatar({
  initials,
  size = 'md',
  color = 'blue',
  shape = 'circle',
  status,
  src,
  alt,
  imgProps,
  className = '',
  ...props
}: AvatarProps) {
  const label = alt ?? initials;
  const displayInitials = initials.slice(0, 2).toUpperCase();

  return (
    <span
      className={avatarClassName({ size, color, shape, className })}
      role="img"
      aria-label={label}
      {...props}
    >
      {src ? (
        <img className="avatar__img" src={src} alt={alt ?? ''} {...imgProps} />
      ) : (
        <span className="avatar__initials" aria-hidden>
          {displayInitials}
        </span>
      )}
      {status && (
        <span
          className={['avatar__status', STATUS_CLASS[status]].join(' ')}
          aria-hidden
        />
      )}
    </span>
  );
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  children: ReactNode;
}

export function AvatarGroup({ max = 4, children, className = '', ...props }: AvatarGroupProps) {
  const avatars = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[];
  const items = avatars.slice(0, max);
  const overflow = avatars.length > max ? avatars.length - max : 0;

  return (
    <div className={['avatar-group', className].filter(Boolean).join(' ')} {...props}>
      {items.map((child, index) => (
        <span key={child.key ?? index} className="avatar-group__item">
          {child}
        </span>
      ))}
      {overflow > 0 && (
        <span className="avatar-group__overflow" aria-label={`${overflow} more`}>
          +{overflow}
        </span>
      )}
    </div>
  );
}
