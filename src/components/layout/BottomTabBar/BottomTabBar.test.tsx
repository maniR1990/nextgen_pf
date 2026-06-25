import type { MobileConfig } from '@/lib/schemas/appHeader';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BottomTabBar } from './BottomTabBar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn() }),
}));

const mockConfig: MobileConfig = {
  tabBar: [
    { id: 'home', label: 'Home', icon: 'home', href: '/dashboard' },
    { id: 'budget', label: 'Budget', icon: 'bar-chart', href: '/dashboard/budget' },
    { id: 'fab', label: '', icon: 'plus', isFab: true },
    { id: 'goals', label: 'Goals', icon: 'target', href: '/dashboard/goals' },
    { id: 'profile', label: 'Profile', icon: 'user', href: '/dashboard/profile' },
  ],
  fabRadial: {
    radiusPx: 80,
    animationMs: 200,
    actions: [
      {
        id: 'expense',
        label: 'Expense',
        icon: 'arrow-down-left',
        color: 'error',
        transactionType: 'EXPENSE',
      },
      {
        id: 'income',
        label: 'Income',
        icon: 'arrow-up-right',
        color: 'success',
        transactionType: 'INCOME',
      },
      {
        id: 'transfer',
        label: 'Transfer',
        icon: 'arrow-left-right',
        color: 'info',
        transactionType: 'TRANSFER',
      },
      {
        id: 'investment',
        label: 'Investment',
        icon: 'trending-up',
        color: 'purple',
        transactionType: 'INVESTMENT',
      },
    ],
  },
};

function renderBar(onAction = vi.fn()) {
  render(<BottomTabBar config={mockConfig} onFabAction={onAction} />);
  return { onAction };
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

describe('BottomTabBar', () => {
  it('renders tab labels (non-FAB)', () => {
    renderBar();
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Budget')).toBeDefined();
    expect(screen.getByText('Goals')).toBeDefined();
    expect(screen.getByText('Profile')).toBeDefined();
  });

  it('marks current route tab as active', () => {
    renderBar();
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink.getAttribute('aria-current')).toBe('page');
  });

  it('renders FAB button in the center', () => {
    renderBar();
    const fab = document.querySelector('.bottom-tab-bar__fab');
    expect(fab).toBeDefined();
  });
});

// ─── FAB radial ───────────────────────────────────────────────────────────────

describe('FabRadial', () => {
  it('radial actions are not visible before FAB tap', () => {
    renderBar();
    expect(screen.queryByText('Expense')).toBeNull();
    expect(screen.queryByText('Income')).toBeNull();
  });

  it('opens radial menu on FAB click', () => {
    renderBar();
    const fab = document.querySelector('.bottom-tab-bar__fab')!;
    fireEvent.click(fab);
    expect(screen.getByText('Expense')).toBeDefined();
    expect(screen.getByText('Income')).toBeDefined();
    expect(screen.getByText('Transfer')).toBeDefined();
    expect(screen.getByText('Investment')).toBeDefined();
  });

  it('shows scrim when radial is open', () => {
    renderBar();
    fireEvent.click(document.querySelector('.bottom-tab-bar__fab')!);
    expect(document.querySelector('.fab-scrim')).toBeDefined();
  });

  it('closes radial when scrim is clicked', () => {
    renderBar();
    fireEvent.click(document.querySelector('.bottom-tab-bar__fab')!);
    fireEvent.click(document.querySelector('.fab-scrim')!);
    expect(screen.queryByText('Expense')).toBeNull();
  });

  it('calls onFabAction with transactionType when action is clicked', () => {
    const { onAction } = renderBar();
    fireEvent.click(document.querySelector('.bottom-tab-bar__fab')!);
    fireEvent.click(screen.getByText('Expense'));
    expect(onAction).toHaveBeenCalledWith('EXPENSE');
  });

  it('closes radial after action click', () => {
    renderBar();
    fireEvent.click(document.querySelector('.bottom-tab-bar__fab')!);
    fireEvent.click(screen.getByText('Income'));
    expect(screen.queryByText('Expense')).toBeNull();
  });
});
