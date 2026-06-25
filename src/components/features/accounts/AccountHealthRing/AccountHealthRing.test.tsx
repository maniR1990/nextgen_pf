import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AccountHealthRing } from './AccountHealthRing';

describe('AccountHealthRing', () => {
  it('renders an svg with accessible label', () => {
    render(<AccountHealthRing score={75} />);
    expect(screen.getByRole('img', { name: /health score/i })).toBeInTheDocument();
  });

  it('shows score text', () => {
    render(<AccountHealthRing score={82} />);
    expect(screen.getByText('82')).toBeInTheDocument();
  });

  it('applies green class for healthy score', () => {
    const { container } = render(<AccountHealthRing score={80} />);
    expect(container.querySelector('.account-health-ring--healthy')).toBeInTheDocument();
  });

  it('applies amber class for ok score', () => {
    const { container } = render(<AccountHealthRing score={55} />);
    expect(container.querySelector('.account-health-ring--ok')).toBeInTheDocument();
  });

  it('applies red class for low score', () => {
    const { container } = render(<AccountHealthRing score={25} />);
    expect(container.querySelector('.account-health-ring--low')).toBeInTheDocument();
  });
});
