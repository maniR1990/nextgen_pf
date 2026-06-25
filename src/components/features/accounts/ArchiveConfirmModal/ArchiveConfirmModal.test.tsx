import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArchiveConfirmModal } from './ArchiveConfirmModal';

describe('ArchiveConfirmModal', () => {
  it('renders account name in prompt', () => {
    render(
      <ArchiveConfirmModal open onClose={vi.fn()} accountName="HDFC Salary" onConfirm={vi.fn()} />,
    );
    expect(screen.getByText(/HDFC Salary/)).toBeInTheDocument();
  });

  it('calls onConfirm when Archive button clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ArchiveConfirmModal
        open
        onClose={vi.fn()}
        accountName="HDFC Salary"
        onConfirm={onConfirm}
      />,
    );
    await user.click(screen.getByRole('button', { name: /archive/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onClose when cancel clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ArchiveConfirmModal open onClose={onClose} accountName="HDFC Salary" onConfirm={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
