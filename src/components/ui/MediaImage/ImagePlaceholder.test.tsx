import { cleanup, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it } from 'vitest';
import { ImagePlaceholder, imagePlaceholderClassName } from './ImagePlaceholder';

expect.extend(toHaveNoViolations);

describe('ImagePlaceholder', () => {
  afterEach(() => cleanup());

  it('renders label with aspect and radius classes', () => {
    const { container } = render(
      <ImagePlaceholder aspect="16-9" radius="lg" label="Product Image — 400 × 300" />,
    );
    expect(screen.getByRole('img', { name: 'Product Image — 400 × 300' })).toBeInTheDocument();
    expect(container.querySelector('.image-placeholder--aspect-16-9')).toBeInTheDocument();
    expect(container.querySelector('.image-placeholder--radius-lg')).toBeInTheDocument();
  });

  it('applies placeholder class helper', () => {
    expect(imagePlaceholderClassName({ aspect: '1-1', radius: 'full' })).toContain(
      'image-placeholder--aspect-1-1',
    );
  });

  it('is accessible — has no a11y violations', async () => {
    const { container } = render(<ImagePlaceholder label="Banner" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
