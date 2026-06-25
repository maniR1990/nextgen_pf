import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MediaImage } from './MediaImage';

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

describe('MediaImage', () => {
  afterEach(() => cleanup());

  it('renders placeholder when src is missing', () => {
    render(<MediaImage alt="Product" placeholderLabel="Product Image — 400 × 300" />);
    expect(screen.getByRole('img', { name: 'Product Image — 400 × 300' })).toBeInTheDocument();
  });

  it('renders image when src is provided', () => {
    render(<MediaImage src="/product.jpg" alt="Product" width={400} height={300} />);
    expect(screen.getByRole('img', { name: 'Product' })).toHaveAttribute('src', '/product.jpg');
  });
});
