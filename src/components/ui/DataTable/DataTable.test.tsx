import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';
import { TRANSACTION_COLUMNS, TRANSACTION_ROWS } from './sampleData';

expect.extend(toHaveNoViolations);

describe('DataTable', () => {
  afterEach(() => cleanup());

  it('renders transaction rows from JSON columns', () => {
    render(
      <DataTable
        tableId="test-table"
        columns={TRANSACTION_COLUMNS}
        data={TRANSACTION_ROWS.slice(0, 4)}
        persistPreferences={false}
      />,
    );
    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();
    expect(within(grid).getByText('Grocery Store')).toBeInTheDocument();
    expect(within(grid).getByText('Netflix')).toBeInTheDocument();
  });

  it('filters via global search', async () => {
    render(
      <DataTable
        tableId="test-search"
        columns={TRANSACTION_COLUMNS}
        data={TRANSACTION_ROWS.slice(0, 4)}
        persistPreferences={false}
      />,
    );
    await userEvent.type(screen.getByLabelText('Search table'), 'Netflix');
    const grid = screen.getByRole('grid');
    expect(within(grid).getByText('Netflix')).toBeInTheDocument();
    expect(within(grid).queryByText('Grocery Store')).not.toBeInTheDocument();
  });

  it('sorts when header is clicked', async () => {
    render(
      <DataTable
        tableId="test-sort"
        columns={TRANSACTION_COLUMNS}
        data={TRANSACTION_ROWS.slice(0, 4)}
        persistPreferences={false}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Amount/i }));
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('shows empty state when no rows match', async () => {
    render(
      <DataTable
        tableId="test-empty"
        columns={TRANSACTION_COLUMNS}
        data={[]}
        persistPreferences={false}
        emptyState={{ title: 'No records found' }}
      />,
    );
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('invokes row action from kebab menu', async () => {
    const onView = vi.fn();
    render(
      <DataTable
        tableId="test-actions"
        columns={TRANSACTION_COLUMNS}
        data={TRANSACTION_ROWS.slice(0, 1)}
        persistPreferences={false}
        rowActions={[{ id: 'view', label: 'View Details', onAction: onView }]}
      />,
    );
    await userEvent.click(within(screen.getByRole('grid')).getByLabelText('Row actions'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'View Details' }));
    expect(onView).toHaveBeenCalledOnce();
  });

  it('is accessible — has no a11y violations', async () => {
    const { container } = render(
      <DataTable
        tableId="test-a11y"
        columns={TRANSACTION_COLUMNS}
        data={TRANSACTION_ROWS.slice(0, 2)}
        persistPreferences={false}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
