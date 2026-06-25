import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FundGroupPicker } from './FundGroupPicker';

const mockGroups = [
  { id: 'fg1', name: 'Emergency', color: '#ef4444', slug: 'emergency' },
  { id: 'fg2', name: 'Wealth', color: '#22c55e', slug: 'wealth' },
];

describe('FundGroupPicker', () => {
  it('renders fund group dropdown', () => {
    render(
      <FundGroupPicker groups={mockGroups} value={null} flow={null} onChange={vi.fn()} />,
    );
    expect(screen.getByRole('combobox', { name: /fund group/i })).toBeInTheDocument();
  });

  it('lists all fund groups as options', () => {
    render(
      <FundGroupPicker groups={mockGroups} value={null} flow={null} onChange={vi.fn()} />,
    );
    expect(screen.getByRole('option', { name: 'Emergency' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Wealth' })).toBeInTheDocument();
  });

  it('shows IN/OUT direction radios when a group is selected', () => {
    render(
      <FundGroupPicker groups={mockGroups} value="fg1" flow="IN" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('radio', { name: /saving to this fund/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /using from this fund/i })).toBeInTheDocument();
  });

  it('does not show direction radios when no group is selected', () => {
    render(
      <FundGroupPicker groups={mockGroups} value={null} flow={null} onChange={vi.fn()} />,
    );
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('IN radio is checked when flow=IN', () => {
    render(
      <FundGroupPicker groups={mockGroups} value="fg1" flow="IN" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('radio', { name: /saving to this fund/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /using from this fund/i })).not.toBeChecked();
  });

  it('OUT radio is checked when flow=OUT', () => {
    render(
      <FundGroupPicker groups={mockGroups} value="fg1" flow="OUT" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('radio', { name: /using from this fund/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /saving to this fund/i })).not.toBeChecked();
  });

  it('calls onChange with fundGroupId and flow=IN when group first selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FundGroupPicker groups={mockGroups} value={null} flow={null} onChange={onChange} />,
    );

    await user.selectOptions(screen.getByRole('combobox', { name: /fund group/i }), 'fg1');

    expect(onChange).toHaveBeenCalledWith({ fundGroupId: 'fg1', fundGroupFlow: 'IN' });
  });

  it('calls onChange with flow=OUT when OUT radio clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FundGroupPicker groups={mockGroups} value="fg1" flow="IN" onChange={onChange} />,
    );

    await user.click(screen.getByRole('radio', { name: /using from this fund/i }));

    expect(onChange).toHaveBeenCalledWith({ fundGroupId: 'fg1', fundGroupFlow: 'OUT' });
  });

  it('calls onChange with null values when group cleared', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FundGroupPicker groups={mockGroups} value="fg1" flow="IN" onChange={onChange} />,
    );

    await user.selectOptions(screen.getByRole('combobox', { name: /fund group/i }), '');

    expect(onChange).toHaveBeenCalledWith({ fundGroupId: null, fundGroupFlow: null });
  });

  it('shows empty-state message when no groups exist', () => {
    render(
      <FundGroupPicker groups={[]} value={null} flow={null} onChange={vi.fn()} />,
    );
    expect(screen.getByText(/no fund groups/i)).toBeInTheDocument();
  });

  it('renders a blank "none" option as default', () => {
    render(
      <FundGroupPicker groups={mockGroups} value={null} flow={null} onChange={vi.fn()} />,
    );
    const combobox = screen.getByRole('combobox', { name: /fund group/i });
    expect((combobox as HTMLSelectElement).value).toBe('');
  });
});
