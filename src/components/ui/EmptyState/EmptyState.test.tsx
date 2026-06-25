import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mailbox } from 'lucide-react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EMPTY_STATE_DEMO_TRANSACTIONS_ACTION,
  EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION,
  EMPTY_STATE_DEMO_TRANSACTIONS_TITLE,
} from '@/constants/emptyState';
import { EmptyState, emptyStateClassName } from './EmptyState';

expect.extend(toHaveNoViolations);

describe('EmptyState', () => {
  afterEach(() => cleanup());

  it('renders icon, title, and description', () => {
    render(
      <EmptyState
        icon={Mailbox}
        title={EMPTY_STATE_DEMO_TRANSACTIONS_TITLE}
        description={EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION}
      />,
    );
    expect(screen.getByRole('heading', { level: 3, name: EMPTY_STATE_DEMO_TRANSACTIONS_TITLE })).toBeInTheDocument();
    expect(screen.getByText(EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION)).toBeInTheDocument();
    expect(document.querySelector('.empty-state__icon')).toBeInTheDocument();
  });

  it('renders action button when actionLabel and onAction are provided', async () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title={EMPTY_STATE_DEMO_TRANSACTIONS_TITLE}
        actionLabel={EMPTY_STATE_DEMO_TRANSACTIONS_ACTION}
        onAction={onAction}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: EMPTY_STATE_DEMO_TRANSACTIONS_ACTION }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('omits action button when only actionLabel is provided', () => {
    render(
      <EmptyState
        title={EMPTY_STATE_DEMO_TRANSACTIONS_TITLE}
        actionLabel={EMPTY_STATE_DEMO_TRANSACTIONS_ACTION}
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies size modifier class', () => {
    expect(emptyStateClassName({ size: 'lg' })).toContain('empty-state--lg');
  });

  it('is accessible — has no a11y violations', async () => {
    const { container } = render(
      <EmptyState
        title={EMPTY_STATE_DEMO_TRANSACTIONS_TITLE}
        description={EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION}
        role="status"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
