import { cleanup, render, screen } from '@testing-library/react';
import { Target } from 'lucide-react';
import { afterEach, describe, expect, it } from 'vitest';
import { DashboardSectionPage } from './DashboardSectionPage';

describe('DashboardSectionPage', () => {
  afterEach(() => cleanup());

  it('renders the title as an empty-state heading', () => {
    render(<DashboardSectionPage title="Goals" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Goals' })).toBeInTheDocument();
  });

  it('falls back to a default "not built yet" description', () => {
    render(<DashboardSectionPage title="Goals" />);
    expect(screen.getByText(/isn't built yet/i)).toBeInTheDocument();
  });

  it('renders a custom description when provided', () => {
    render(<DashboardSectionPage title="Goals" description="Custom copy" />);
    expect(screen.getByText('Custom copy')).toBeInTheDocument();
    expect(screen.queryByText(/isn't built yet/i)).not.toBeInTheDocument();
  });

  it('renders the provided icon', () => {
    render(<DashboardSectionPage title="Goals" icon={Target} />);
    expect(document.querySelector('.empty-state__icon')).toBeInTheDocument();
  });
});
