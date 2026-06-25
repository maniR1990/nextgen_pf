import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  afterEach(() => cleanup());

  it('renders children inside card shell', () => {
    render(<Card>Auth content</Card>);
    expect(screen.getByText('Auth content')).toHaveClass('card');
  });
});
