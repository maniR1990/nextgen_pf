import type { FundGroupSummary } from '@/modules/fund-groups/fund-groups.types';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FundGroupCard } from './FundGroupCard';

afterEach(() => cleanup());

const mockGroup: FundGroupSummary = {
  id: 'group-1',
  name: 'Kids Education',
  description: null,
  slug: 'kids-education',
  purposeHint: 'GOAL',
  order: 0,
  color: '#4f9cf9',
  isSystem: false,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('FundGroupCard', () => {
  it('renders the group name', () => {
    render(<FundGroupCard group={mockGroup} fundCount={1} />);
    expect(screen.getByText('Kids Education')).toBeInTheDocument();
  });

  // Regression: FundBucketBoard's scrollable `overflow-y: auto` body can clip a plain
  // position:absolute dropdown once a group is scrolled near the bottom edge — same
  // bug class as FundListRow's per-fund menu. The menu is portaled to document.body
  // now, so it must be findable/clickable via screen queries.
  describe('options menu (portaled to document.body)', () => {
    it('opens on trigger click and is queryable via screen', async () => {
      const user = userEvent.setup();
      render(<FundGroupCard group={mockGroup} fundCount={1} onEdit={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: /options for kids education/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('fires onEdit (Rename) with the group and closes the menu', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<FundGroupCard group={mockGroup} fundCount={1} onEdit={onEdit} />);
      await user.click(screen.getByRole('button', { name: /options for kids education/i }));
      await user.click(screen.getByRole('menuitem', { name: /rename/i }));
      expect(onEdit).toHaveBeenCalledWith(mockGroup);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('disables Delete when the group still has funds in it', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<FundGroupCard group={mockGroup} fundCount={2} onDelete={onDelete} />);
      await user.click(screen.getByRole('button', { name: /options for kids education/i }));
      const deleteItem = screen.getByRole('menuitem', { name: /delete/i });
      expect(deleteItem).toBeDisabled();
      await user.click(deleteItem);
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('fires onDelete once the group has no funds left', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<FundGroupCard group={mockGroup} fundCount={0} onDelete={onDelete} />);
      await user.click(screen.getByRole('button', { name: /options for kids education/i }));
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));
      expect(onDelete).toHaveBeenCalledWith(mockGroup);
    });

    it('disables Delete for a system group even with zero funds', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <FundGroupCard
          group={{ ...mockGroup, isSystem: true }}
          fundCount={0}
          onDelete={onDelete}
        />,
      );
      await user.click(screen.getByRole('button', { name: /options for kids education/i }));
      expect(screen.getByRole('menuitem', { name: /delete/i })).toBeDisabled();
    });

    it('closes when clicking outside the trigger and the portaled menu', async () => {
      const user = userEvent.setup();
      render(<FundGroupCard group={mockGroup} fundCount={1} onEdit={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: /options for kids education/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.click(document.body);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('does not render the menu for an archived group', () => {
    render(
      <FundGroupCard
        group={{ ...mockGroup, archivedAt: new Date() }}
        fundCount={0}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /options for/i })).not.toBeInTheDocument();
  });
});
