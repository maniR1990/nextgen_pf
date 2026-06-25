import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Skeleton, SkeletonCard, skeletonClassName } from './Skeleton';

describe('Skeleton', () => {
  afterEach(() => cleanup());

  it('renders text skeleton', () => {
    const { container } = render(<Skeleton variant="text" />);
    expect(container.querySelector('.skeleton--text')).toBeInTheDocument();
  });

  it('renders circle skeleton', () => {
    const { container } = render(<Skeleton variant="circle" />);
    expect(container.querySelector('.skeleton--circle')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    expect(skeletonClassName({ variant: 'rect' })).toContain('skeleton--rect');
  });

  it('renders skeleton card with busy state', () => {
    render(<SkeletonCard />);
    expect(screen.getByLabelText('Loading')).toHaveAttribute('aria-busy');
  });
});
