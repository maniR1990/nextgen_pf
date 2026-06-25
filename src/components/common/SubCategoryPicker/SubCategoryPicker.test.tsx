import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SubCategoryPicker } from './SubCategoryPicker';
import type { ParentCategory } from './SubCategoryPicker';

afterEach(() => cleanup());

const CATEGORIES: ParentCategory[] = [
  {
    id: 'food',
    label: 'Food',
    icon: '🍽️',
    children: [
      { id: 'groceries', label: 'Groceries' },
      { id: 'dining', label: 'Dining' },
    ],
  },
  {
    id: 'transport',
    label: 'Transport',
    icon: '🚗',
    children: [
      { id: 'fuel', label: 'Fuel' },
      { id: 'metro', label: 'Metro' },
    ],
  },
];

describe('SubCategoryPicker', () => {
  describe('rendering', () => {
    it('renders parent categories in desktop panes', () => {
      render(<SubCategoryPicker categories={CATEGORIES} />);
      expect(screen.getAllByText('Food').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Transport').length).toBeGreaterThan(0);
    });

    it('renders children of first parent by default (desktop)', () => {
      render(<SubCategoryPicker categories={CATEGORIES} />);
      expect(screen.getAllByText('Groceries').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Dining').length).toBeGreaterThan(0);
    });

    it('renders label when provided', () => {
      render(<SubCategoryPicker categories={CATEGORIES} label="Select category" />);
      expect(screen.getByText('Select category')).toBeInTheDocument();
    });
  });

  describe('desktop two-pane interaction', () => {
    it('shows children of clicked parent', async () => {
      const user = userEvent.setup();
      render(<SubCategoryPicker categories={CATEGORIES} />);
      const transportBtns = screen.getAllByRole('button', { name: /transport/i });
      await user.click(transportBtns[0]);
      expect(screen.getAllByText('Fuel').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Metro').length).toBeGreaterThan(0);
    });

    it('calls onChange with childId and parentId on selection', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SubCategoryPicker categories={CATEGORIES} onChange={onChange} />);
      const groceriesBtns = screen.getAllByRole('button', { name: /groceries/i });
      await user.click(groceriesBtns[0]);
      expect(onChange).toHaveBeenCalledWith('groceries', 'food');
    });
  });

  describe('selection state', () => {
    it('marks selected child with aria-selected=true', () => {
      render(<SubCategoryPicker categories={CATEGORIES} value="groceries" onChange={vi.fn()} />);
      const selected = screen.getAllByRole('button', { name: /groceries/i }).find(
        b => b.getAttribute('aria-selected') === 'true'
      );
      expect(selected).toBeDefined();
    });
  });
});
