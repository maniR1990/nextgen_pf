import type { FundSummary } from '@/modules/funds/funds.types';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FundListRow } from './FundListRow';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

afterEach(() => {
  cleanup();
  mockPush.mockClear();
});

const mockFund: FundSummary = {
  id: 'fund-1',
  name: 'Emergency Fund',
  purpose: 'EMERGENCY',
  groupId: null,
  groupName: null,
  groupSlug: null,
  groupDescription: null,
  targetAmount: 300000,
  targetMonths: null,
  currentAmount: 180000,
  percentFilled: 60,
  sources: [],
  goalId: null,
  color: '#4f9cf9',
  icon: null,
  order: 0,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('FundListRow', () => {
  it('renders the fund name and purpose', () => {
    render(<FundListRow fund={mockFund} />);
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
  });

  it('navigates to the fund detail page when the row is clicked', async () => {
    const user = userEvent.setup();
    render(<FundListRow fund={mockFund} />);
    await user.click(screen.getByRole('button', { name: /view emergency fund/i }));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/settings/funds/fund-1');
  });

  it('does not render the options menu when no handlers are passed', () => {
    render(<FundListRow fund={mockFund} />);
    expect(screen.queryByRole('button', { name: /options for/i })).not.toBeInTheDocument();
  });

  // Regression: this row lives inside the group section's collapsible body, which
  // needs overflow:hidden on an ancestor for its expand/collapse animation — a plain
  // position:absolute dropdown there rendered but was invisible (clipped), so clicking
  // the trigger looked like nothing happened. The menu is portaled to document.body now
  // (see FundListRow.tsx), so it must actually be findable/clickable via screen queries
  // even though it isn't a DOM descendant of the row anymore.
  describe('options menu (portaled to document.body)', () => {
    it('opens on trigger click and is queryable via screen (proves the portal renders, not just React state)', async () => {
      const user = userEvent.setup();
      render(<FundListRow fund={mockFund} onEdit={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: /options for emergency fund/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('fires onEdit with the fund and closes the menu', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<FundListRow fund={mockFund} onEdit={onEdit} />);
      await user.click(screen.getByRole('button', { name: /options for emergency fund/i }));
      await user.click(screen.getByRole('menuitem', { name: /edit/i }));
      expect(onEdit).toHaveBeenCalledWith(mockFund);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('fires onAllocate with the fund', async () => {
      const user = userEvent.setup();
      const onAllocate = vi.fn();
      render(<FundListRow fund={mockFund} onAllocate={onAllocate} />);
      await user.click(screen.getByRole('button', { name: /options for emergency fund/i }));
      await user.click(screen.getByRole('menuitem', { name: /allocate/i }));
      expect(onAllocate).toHaveBeenCalledWith(mockFund);
    });

    it('fires onArchive with the fund', async () => {
      const user = userEvent.setup();
      const onArchive = vi.fn();
      render(<FundListRow fund={mockFund} onArchive={onArchive} />);
      await user.click(screen.getByRole('button', { name: /options for emergency fund/i }));
      await user.click(screen.getByRole('menuitem', { name: /archive/i }));
      expect(onArchive).toHaveBeenCalledWith(mockFund);
    });

    it('fires onDelete with the fund', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<FundListRow fund={mockFund} onDelete={onDelete} />);
      await user.click(screen.getByRole('button', { name: /options for emergency fund/i }));
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));
      expect(onDelete).toHaveBeenCalledWith(mockFund);
    });

    it('only shows menu items for handlers that were actually passed', async () => {
      const user = userEvent.setup();
      render(<FundListRow fund={mockFund} onEdit={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: /options for emergency fund/i }));
      expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: /allocate/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: /archive/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('closes when clicking outside the trigger and the portaled menu', async () => {
      const user = userEvent.setup();
      render(<FundListRow fund={mockFund} onEdit={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: /options for emergency fund/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.click(document.body);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('toggles closed when the trigger is clicked again', async () => {
      const user = userEvent.setup();
      render(<FundListRow fund={mockFund} onEdit={vi.fn()} />);
      const trigger = screen.getByRole('button', { name: /options for emergency fund/i });
      await user.click(trigger);
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await user.click(trigger);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('does not trigger row navigation when the menu trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<FundListRow fund={mockFund} onEdit={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: /options for emergency fund/i }));
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
