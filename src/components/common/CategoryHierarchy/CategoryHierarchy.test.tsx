import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CategoryHierarchy } from './CategoryHierarchy';
import sample from './samples/category-hierarchy.sample.json';
import { CategoryHierarchyConfigSchema } from './schemas';

expect.extend(toHaveNoViolations);

const config = CategoryHierarchyConfigSchema.parse(sample);

describe('CategoryHierarchy', () => {
  afterEach(() => cleanup());

  it('renders title, description, and top-level groups from JSON config', () => {
    render(<CategoryHierarchy config={config} />);

    expect(screen.getByRole('heading', { name: config.title! })).toBeInTheDocument();
    expect(screen.getByText(/Level 0 = Group/i)).toBeInTheDocument();
    expect(screen.getByRole('tree', { name: config.ariaLabel })).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Investments')).toBeInTheDocument();
  });

  it('shows GROUP badges for level 0 nodes', () => {
    render(<CategoryHierarchy config={config} />);

    expect(screen.getAllByText('GROUP')).toHaveLength(3);
  });

  it('expands default nodes and renders nested levels with badges', () => {
    render(<CategoryHierarchy config={config} />);

    expect(screen.getByText('Active Income')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getAllByText('L1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('L2').length).toBeGreaterThan(0);
  });

  it('toggles expand/collapse on disclosure control', () => {
    render(<CategoryHierarchy config={config} defaultExpandedIds={['income', 'active-income']} />);

    expect(screen.getByText('Salary')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse Active Income' }));

    expect(screen.queryByText('Salary')).not.toBeInTheDocument();
  });

  it('fires CRUD callbacks from row menu and add link', async () => {
    const onCreate = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();

    render(
      <CategoryHierarchy
        config={config}
        defaultExpandedIds={['income', 'active-income']}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add subcategory' }));
    expect(onCreate).toHaveBeenCalledWith({
      parentId: 'active-income',
      parentLevel: 1,
      groupType: 'income',
    });

    const salaryRow = screen.getByText('Salary').closest('.cat-hierarchy__row');
    expect(salaryRow).toBeTruthy();

    const menuTrigger = within(salaryRow as HTMLElement).getByRole('button', {
      name: 'Actions for Salary',
    });
    fireEvent.click(menuTrigger);

    fireEvent.click(screen.getByRole('menuitem', { name: /Edit/i }));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'salary', name: 'Salary' }),
    );

    fireEvent.click(menuTrigger);
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete/i }));
    expect(onDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'salary', name: 'Salary' }),
    );
  });

  it('has no axe violations', async () => {
    const { container } = render(<CategoryHierarchy config={config} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
