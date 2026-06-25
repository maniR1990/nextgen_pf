import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsFilterBar } from './SettingsFilterBar';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/settings',
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('SettingsFilterBar', () => {
  afterEach(() => {
    cleanup();
    replace.mockClear();
  });

  it('renders accounts, funds and categories chips', () => {
    render(<SettingsFilterBar />);

    expect(screen.getByRole('toolbar', { name: 'Settings sections' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Accounts', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Funds' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Categories' })).toBeInTheDocument();
  });

  it('updates tab query param when Funds chip is clicked', () => {
    render(<SettingsFilterBar />);

    fireEvent.click(screen.getByRole('tab', { name: 'Funds' }));
    expect(replace).toHaveBeenCalledWith('/dashboard/settings?tab=funds', { scroll: false });
  });

  it('updates tab query param when Categories chip is clicked', () => {
    render(<SettingsFilterBar />);

    fireEvent.click(screen.getByRole('tab', { name: 'Categories' }));
    expect(replace).toHaveBeenCalledWith('/dashboard/settings?tab=categories', { scroll: false });
  });
});
