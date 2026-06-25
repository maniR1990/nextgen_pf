import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CategoryPicker } from './CategoryPicker';
import type { CategoryPickerOption } from './CategoryPicker';

afterEach(() => cleanup());

const OPTIONS: CategoryPickerOption[] = [
  { id: 'c1', label: 'Groceries', icon: '🛒', parentLabel: 'Food' },
  { id: 'c2', label: 'Dining Out', icon: '🍽️', parentLabel: 'Food' },
  { id: 'c3', label: 'Fuel', icon: '⛽', parentLabel: 'Transport' },
  { id: 'c4', label: 'Rent', icon: '🏠', parentLabel: 'Housing' },
];

describe('CategoryPicker', () => {
  describe('rendering', () => {
    it('renders trigger button', () => {
      render(<CategoryPicker options={OPTIONS} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows placeholder when no value selected', () => {
      render(<CategoryPicker options={OPTIONS} placeholder="Pick category" />);
      expect(screen.getByText('Pick category')).toBeInTheDocument();
    });

    it('shows selected option label', () => {
      render(<CategoryPicker options={OPTIONS} value="c1" onChange={vi.fn()} />);
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    it('renders label', () => {
      render(<CategoryPicker options={OPTIONS} label="Category" />);
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('renders error message', () => {
      render(<CategoryPicker options={OPTIONS} error="Required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Required');
    });
  });

  describe('dropdown', () => {
    it('opens dropdown on click', async () => {
      const user = userEvent.setup();
      render(<CategoryPicker options={OPTIONS} />);
      await user.click(screen.getByRole('button'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('shows all options when open', async () => {
      const user = userEvent.setup();
      render(<CategoryPicker options={OPTIONS} />);
      await user.click(screen.getByRole('button'));
      expect(screen.getByRole('option', { name: /groceries/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /fuel/i })).toBeInTheDocument();
    });

    it('shows group labels', async () => {
      const user = userEvent.setup();
      render(<CategoryPicker options={OPTIONS} />);
      await user.click(screen.getByRole('button'));
      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('Transport')).toBeInTheDocument();
    });

    it('filters options by search query', async () => {
      const user = userEvent.setup();
      render(<CategoryPicker options={OPTIONS} />);
      await user.click(screen.getByRole('button'));
      await user.type(screen.getByRole('textbox', { name: /search/i }), 'fuel');
      expect(screen.queryByRole('option', { name: /groceries/i })).not.toBeInTheDocument();
      expect(screen.getByRole('option', { name: /fuel/i })).toBeInTheDocument();
    });

    it('shows empty state when no results', async () => {
      const user = userEvent.setup();
      render(<CategoryPicker options={OPTIONS} />);
      await user.click(screen.getByRole('button'));
      await user.type(screen.getByRole('textbox', { name: /search/i }), 'xyz123');
      expect(screen.getByText(/no categories found/i)).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('calls onChange with selected id', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategoryPicker options={OPTIONS} onChange={onChange} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('option', { name: /groceries/i }));
      expect(onChange).toHaveBeenCalledWith('c1');
    });

    it('closes dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<CategoryPicker options={OPTIONS} onChange={vi.fn()} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('option', { name: /groceries/i }));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('marks selected option with aria-selected=true', async () => {
      const user = userEvent.setup();
      render(<CategoryPicker options={OPTIONS} value="c1" onChange={vi.fn()} />);
      await user.click(screen.getByRole('button'));
      expect(screen.getByRole('option', { name: /groceries/i })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
  });

  describe('keyboard', () => {
    it('closes dropdown on Escape', async () => {
      const user = userEvent.setup();
      render(<CategoryPicker options={OPTIONS} />);
      await user.click(screen.getByRole('button'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});
