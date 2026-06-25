import { cleanup, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it } from 'vitest';
import { Badge, badgeClassName } from './Badge';

expect.extend(toHaveNoViolations);

describe('Badge', () => {
  afterEach(() => cleanup());

  it('renders label text', () => {
    render(<Badge variant="active">Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies variant and kind classes', () => {
    expect(badgeClassName({ variant: 'success' })).toContain('badge--success');
    expect(badgeClassName({ variant: 'admin', kind: 'label' })).toContain('badge--label');
    expect(badgeClassName({ variant: 'verified', kind: 'label' })).toContain('badge--verified');
  });

  it('shows status dot for active variants by default', () => {
    const { container } = render(<Badge variant="error">Error</Badge>);
    expect(container.querySelector('.badge__dot')).toBeInTheDocument();
  });

  it('hides dot for inactive and beta unless forced', () => {
    const { container: inactive } = render(<Badge variant="inactive">Inactive</Badge>);
    expect(inactive.querySelector('.badge__dot')).not.toBeInTheDocument();

    const { container: beta } = render(<Badge variant="beta">Beta</Badge>);
    expect(beta.querySelector('.badge__dot')).not.toBeInTheDocument();
  });

  it('shows dot when dot prop is true', () => {
    const { container } = render(
      <Badge variant="inactive" dot>
        Inactive
      </Badge>,
    );
    expect(container.querySelector('.badge__dot')).toBeInTheDocument();
  });

  it('resolves label kind for admin, pro, free, verified', () => {
    const { container } = render(<Badge variant="pro">Pro</Badge>);
    expect(container.firstChild).toHaveClass('badge--label');
    expect(container.querySelector('.badge__dot')).not.toBeInTheDocument();
  });

  it('is accessible — has no a11y violations', async () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
