import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NestedCategoryPicker } from './NestedCategoryPicker';
import type { CategoryNode } from './NestedCategoryPicker';

afterEach(() => cleanup());

const CATEGORIES: CategoryNode[] = [
  {
    id: 'food',
    label: 'Food',
    icon: '🍽️',
    children: [
      {
        id: 'dining',
        label: 'Dining',
        children: [
          { id: 'restaurant', label: 'Restaurant' },
          { id: 'fast-food', label: 'Fast Food' },
        ],
      },
      { id: 'groceries', label: 'Groceries' },
    ],
  },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'misc', label: 'Misc' },
];

describe('NestedCategoryPicker', () => {
  describe('rendering', () => {
    it('renders top-level categories', () => {
      render(<NestedCategoryPicker categories={CATEGORIES} />);
      expect(screen.getByRole('button', { name: /^food$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^transport$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^misc$/i })).toBeInTheDocument();
    });

    it('renders breadcrumb root "All"', () => {
      render(<NestedCategoryPicker categories={CATEGORIES} />);
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('shows child count badge for categories with children', () => {
      render(<NestedCategoryPicker categories={CATEGORIES} />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('drills into category with children', async () => {
      const user = userEvent.setup();
      render(<NestedCategoryPicker categories={CATEGORIES} />);
      await user.click(screen.getByRole('button', { name: /^food$/i }));
      expect(screen.getByRole('button', { name: /dining/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /groceries/i })).toBeInTheDocument();
    });

    it('shows updated breadcrumb after drill', async () => {
      const user = userEvent.setup();
      render(<NestedCategoryPicker categories={CATEGORIES} />);
      await user.click(screen.getByRole('button', { name: /^food$/i }));
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    it('navigates back via breadcrumb', async () => {
      const user = userEvent.setup();
      render(<NestedCategoryPicker categories={CATEGORIES} />);
      await user.click(screen.getByRole('button', { name: /^food$/i }));
      await user.click(screen.getByRole('button', { name: /all/i }));
      expect(screen.getByRole('button', { name: /^transport$/i })).toBeInTheDocument();
    });

    it('drills 3 levels deep', async () => {
      const user = userEvent.setup();
      render(<NestedCategoryPicker categories={CATEGORIES} />);
      await user.click(screen.getByRole('button', { name: /^food$/i }));
      await user.click(screen.getByRole('button', { name: /dining/i }));
      expect(screen.getByRole('button', { name: /restaurant/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fast food/i })).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('calls onChange when a leaf node is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<NestedCategoryPicker categories={CATEGORIES} onChange={onChange} />);
      await user.click(screen.getByRole('button', { name: /^misc$/i }));
      expect(onChange).toHaveBeenCalledWith('misc', ['misc']);
    });

    it('marks selected item with aria-selected=true', () => {
      render(<NestedCategoryPicker categories={CATEGORIES} value="transport" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /transport/i })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
  });
});
