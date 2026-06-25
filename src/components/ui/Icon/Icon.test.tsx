import { cleanup, render } from '@testing-library/react';
import { Home } from 'lucide-react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it } from 'vitest';
import { ICON_SIZES, ICON_STROKE_WIDTH } from '@/constants/icons';
import { Icon, iconClassName } from './Icon';

expect.extend(toHaveNoViolations);

describe('Icon', () => {
  afterEach(() => cleanup());

  it('renders Lucide icon with size class', () => {
    const { container } = render(<Icon icon={Home} size="md" />);
    expect(container.querySelector('.icon--md')).toBeInTheDocument();
  });

  it('uses 1.5px stroke width by default', () => {
    const { container } = render(<Icon icon={Home} />);
    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', String(ICON_STROKE_WIDTH));
  });

  it('applies tone class', () => {
    expect(iconClassName({ tone: 'brand' })).toContain('icon--brand');
  });

  it('maps size tokens to pixel values', () => {
    expect(ICON_SIZES.md).toBe(20);
    expect(ICON_SIZES.xl).toBe(32);
  });

  it('is accessible when decorative', async () => {
    const { container } = render(<Icon icon={Home} aria-hidden />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
