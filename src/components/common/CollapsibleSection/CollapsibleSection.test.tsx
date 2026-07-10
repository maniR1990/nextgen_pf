import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { CollapsibleSection } from './CollapsibleSection';

afterEach(() => cleanup());

describe('CollapsibleSection', () => {
  it('hides children by default', () => {
    render(
      <CollapsibleSection label="More details">
        <p>Secret content</p>
      </CollapsibleSection>,
    );
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });

  it('shows the toggle button with the given label', () => {
    render(
      <CollapsibleSection label="More details — tags, notes">
        <p>Secret content</p>
      </CollapsibleSection>,
    );
    expect(screen.getByRole('button', { name: /more details — tags, notes/i })).toBeInTheDocument();
  });

  it('reveals children after clicking the toggle', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSection label="More details">
        <p>Secret content</p>
      </CollapsibleSection>,
    );

    await user.click(screen.getByRole('button', { name: /more details/i }));

    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });

  it('hides children again after a second click', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSection label="More details">
        <p>Secret content</p>
      </CollapsibleSection>,
    );

    const toggle = screen.getByRole('button', { name: /more details/i });
    await user.click(toggle);
    await user.click(toggle);

    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });

  it('sets aria-expanded to reflect open state', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSection label="More details">
        <p>Secret content</p>
      </CollapsibleSection>,
    );

    const toggle = screen.getByRole('button', { name: /more details/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders open by default when defaultOpen is true', () => {
    render(
      <CollapsibleSection label="More details" defaultOpen>
        <p>Secret content</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });
});
