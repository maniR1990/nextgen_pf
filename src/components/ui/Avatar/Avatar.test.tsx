import { cleanup, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it } from 'vitest';
import { Avatar, AvatarGroup, avatarClassName } from './Avatar';

expect.extend(toHaveNoViolations);

describe('Avatar', () => {
  afterEach(() => cleanup());

  it('renders uppercase initials (max 2 chars)', () => {
    render(<Avatar initials="alice" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'alice' })).toBeInTheDocument();
  });

  it('uses alt for aria-label when provided', () => {
    render(<Avatar initials="AJ" alt="Alice Johnson" />);
    expect(screen.getByRole('img', { name: 'Alice Johnson' })).toBeInTheDocument();
  });

  it('renders image when src is set', () => {
    const { container } = render(<Avatar initials="AJ" src="/avatar.png" alt="Alice" />);
    const img = container.querySelector('.avatar__img');
    expect(img).toHaveAttribute('src', '/avatar.png');
    expect(img).toHaveAttribute('alt', 'Alice');
  });

  it('renders status indicator when status is set', () => {
    const { container } = render(<Avatar initials="AJ" status="online" />);
    expect(container.querySelector('.avatar__status--online')).toBeInTheDocument();
  });

  it('applies size, color, and shape classes', () => {
    expect(avatarClassName({ size: 'lg', color: 'purple', shape: 'rounded' })).toContain(
      'avatar--lg',
    );
    expect(avatarClassName({ size: 'lg', color: 'purple', shape: 'rounded' })).toContain(
      'avatar--purple',
    );
    expect(avatarClassName({ size: 'lg', color: 'purple', shape: 'rounded' })).toContain(
      'avatar--rounded',
    );
  });

  it('is accessible — has no a11y violations', async () => {
    const { container } = render(<Avatar initials="AJ" alt="Alice Johnson" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('AvatarGroup', () => {
  afterEach(() => cleanup());

  it('shows overflow count when children exceed max', () => {
    render(
      <AvatarGroup max={2}>
        <Avatar initials="A" />
        <Avatar initials="B" />
        <Avatar initials="C" />
        <Avatar initials="D" />
      </AvatarGroup>,
    );
    expect(screen.getByLabelText('2 more')).toHaveTextContent('+2');
  });

  it('renders all avatars when within max', () => {
    render(
      <AvatarGroup max={4}>
        <Avatar initials="A" />
        <Avatar initials="B" />
      </AvatarGroup>,
    );
    expect(screen.queryByLabelText(/\d+ more/)).not.toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
