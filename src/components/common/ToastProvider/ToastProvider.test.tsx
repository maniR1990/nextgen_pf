import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { type ReactElement, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from './ToastProvider';
import { DEFAULT_TOAST_DURATION, MAX_TOASTS } from './toast.types';
import { useToast } from './useToast';

// --- Test helpers ---

function ShowToastButton({
  variant = 'success',
  title = 'Test toast',
  duration,
}: {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  duration?: number;
}) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => toast[variant](title, duration !== undefined ? { duration } : undefined)}
    >
      Show toast
    </button>
  );
}

function wrap(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

// --- Tests ---

describe('ToastProvider + useToast', () => {
  afterEach(() => cleanup());

  // context guard
  describe('context guard', () => {
    it('throws when useToast is called outside <ToastProvider>', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useToast())).toThrow(
        'useToast must be used within <ToastProvider>',
      );
      spy.mockRestore();
    });
  });

  // enqueue variants
  describe('enqueue', () => {
    it('renders a success toast with role=status', async () => {
      const user = userEvent.setup();
      wrap(<ShowToastButton variant="success" title="Saved!" />);
      await user.click(screen.getByRole('button', { name: 'Show toast' }));
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Saved!')).toBeInTheDocument();
    });

    it('renders an error toast with role=alert', async () => {
      const user = userEvent.setup();
      wrap(<ShowToastButton variant="error" title="Failed!" />);
      await user.click(screen.getByRole('button', { name: 'Show toast' }));
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders a warning toast with role=alert', async () => {
      const user = userEvent.setup();
      wrap(<ShowToastButton variant="warning" title="Low balance" />);
      await user.click(screen.getByRole('button', { name: 'Show toast' }));
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders an info toast with description', async () => {
      const user = userEvent.setup();
      function WithDesc() {
        const toast = useToast();
        return (
          <button
            type="button"
            onClick={() => toast.info('Heads up', { description: 'More detail' })}
          >
            Show toast
          </button>
        );
      }
      wrap(<WithDesc />);
      await user.click(screen.getByRole('button'));
      expect(screen.getByText('More detail')).toBeInTheDocument();
    });

    it('each call generates a unique toast', async () => {
      const user = userEvent.setup();
      wrap(<ShowToastButton title="Toast" duration={0} />);
      await user.click(screen.getByRole('button', { name: 'Show toast' }));
      await user.click(screen.getByRole('button', { name: 'Show toast' }));
      expect(screen.getAllByText('Toast')).toHaveLength(2);
    });

    it('success returns a string id', async () => {
      let capturedId = '';
      function Capture() {
        const toast = useToast();
        return (
          <button
            type="button"
            onClick={() => {
              capturedId = toast.success('Hi');
            }}
          >
            Show toast
          </button>
        );
      }
      const user = userEvent.setup();
      wrap(<Capture />);
      await user.click(screen.getByRole('button'));
      expect(typeof capturedId).toBe('string');
      expect(capturedId.length).toBeGreaterThan(0);
    });
  });

  // dismiss
  describe('dismiss', () => {
    it('dismiss button removes the toast from the DOM', async () => {
      const user = userEvent.setup();
      wrap(<ShowToastButton title="Dismissible" duration={0} />);
      await user.click(screen.getByRole('button', { name: 'Show toast' }));
      expect(screen.getByText('Dismissible')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
      expect(screen.queryByText('Dismissible')).not.toBeInTheDocument();
    });

    it('dismiss(id) removes the toast programmatically', async () => {
      let capturedId = '';
      function Capture() {
        const toast = useToast();
        return (
          <>
            <button
              type="button"
              onClick={() => {
                capturedId = toast.success('Programmatic', { duration: 0 });
              }}
            >
              Show toast
            </button>
            <button type="button" onClick={() => toast.dismiss(capturedId)}>
              Dismiss by id
            </button>
          </>
        );
      }
      const user = userEvent.setup();
      wrap(<Capture />);
      await user.click(screen.getByRole('button', { name: 'Show toast' }));
      expect(screen.getByText('Programmatic')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Dismiss by id' }));
      expect(screen.queryByText('Programmatic')).not.toBeInTheDocument();
    });
  });

  // auto-dismiss — use fireEvent (synchronous) + act() to avoid fake-timer/userEvent deadlock
  describe('auto-dismiss', () => {
    afterEach(() => vi.useRealTimers());

    it('auto-dismisses after the default duration', () => {
      vi.useFakeTimers();
      function TestComp() {
        const toast = useToast();
        return (
          <button type="button" onClick={() => toast.success('Auto-dismiss')}>
            Show toast
          </button>
        );
      }
      render(
        <ToastProvider>
          <TestComp />
        </ToastProvider>,
      );
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
      });
      expect(screen.getByText('Auto-dismiss')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(DEFAULT_TOAST_DURATION);
      });
      expect(screen.queryByText('Auto-dismiss')).not.toBeInTheDocument();
    });

    it('respects a custom duration', () => {
      vi.useFakeTimers();
      function TestComp() {
        const toast = useToast();
        return (
          <button type="button" onClick={() => toast.success('Custom', { duration: 1_000 })}>
            Show toast
          </button>
        );
      }
      render(
        <ToastProvider>
          <TestComp />
        </ToastProvider>,
      );
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
      });
      act(() => {
        vi.advanceTimersByTime(999);
      });
      expect(screen.getByText('Custom')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByText('Custom')).not.toBeInTheDocument();
    });

    it('does not auto-dismiss when duration is 0', () => {
      vi.useFakeTimers();
      function TestComp() {
        const toast = useToast();
        return (
          <button type="button" onClick={() => toast.success('Persistent', { duration: 0 })}>
            Show toast
          </button>
        );
      }
      render(
        <ToastProvider>
          <TestComp />
        </ToastProvider>,
      );
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
      });
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByText('Persistent')).toBeInTheDocument();
    });
  });

  // max toasts
  describe('max toasts', () => {
    it(`caps the stack at MAX_TOASTS (${MAX_TOASTS})`, async () => {
      const user = userEvent.setup();
      wrap(<ShowToastButton title="Toast" duration={0} />);
      for (let i = 0; i < MAX_TOASTS + 2; i++) {
        await user.click(screen.getByRole('button', { name: 'Show toast' }));
      }
      expect(screen.getAllByText('Toast')).toHaveLength(MAX_TOASTS);
    });

    it('removes the oldest toast when the cap is exceeded', async () => {
      const user = userEvent.setup();
      // counter in ref so it persists across re-renders
      function Numbered() {
        const counter = useRef(0);
        const toast = useToast();
        return (
          <button
            type="button"
            onClick={() => toast.success(`Toast ${++counter.current}`, { duration: 0 })}
          >
            Show toast
          </button>
        );
      }
      wrap(<Numbered />);
      for (let i = 0; i < MAX_TOASTS + 1; i++) {
        await user.click(screen.getByRole('button', { name: 'Show toast' }));
      }
      // First toast pushed out
      expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
      // Last toast visible
      expect(screen.getByText(`Toast ${MAX_TOASTS + 1}`)).toBeInTheDocument();
    });
  });

  // accessibility
  describe('accessibility', () => {
    it('renders a landmarks region labelled "Notifications"', () => {
      render(
        <ToastProvider>
          <div />
        </ToastProvider>,
      );
      expect(screen.getByRole('region', { name: /notifications/i })).toBeInTheDocument();
    });

    it('has no a11y violations with a visible toast', async () => {
      const user = userEvent.setup();
      const { container } = wrap(<ShowToastButton title="A11y toast" duration={0} />);
      await user.click(screen.getByRole('button', { name: 'Show toast' }));
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
