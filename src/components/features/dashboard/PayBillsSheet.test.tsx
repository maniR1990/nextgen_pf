import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';
import { PayBillsSheet } from './PayBillsSheet';

vi.mock('@/hooks/useBudgetSummary', () => ({
  useBudgetSummary: vi.fn(),
}));

vi.mock('@/components/common/PaymentSchedulePanel', () => ({
  PaymentSchedulePanel: (props: { initialSelectMode?: boolean; headless?: boolean; year: number; month: number }) => (
    <div data-testid="panel">
      {`${props.year}-${props.month} select:${String(props.initialSelectMode)} headless:${String(props.headless)}`}
    </div>
  ),
}));

const mockedUseBudgetSummary = vi.mocked(useBudgetSummary);

function mockSummary(state: { data?: unknown; isLoading?: boolean; isError?: boolean }) {
  mockedUseBudgetSummary.mockReturnValue({
    data: state.data,
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
  } as ReturnType<typeof useBudgetSummary>);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PayBillsSheet', () => {
  it('renders nothing when closed and does not fetch', () => {
    mockSummary({});
    render(<PayBillsSheet open={false} onClose={vi.fn()} year={2026} month={10} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockedUseBudgetSummary).toHaveBeenCalledWith(2026, 10, { enabled: false });
  });

  it('opens the payment schedule straight into select mode for that month', () => {
    mockSummary({ data: { year: 2026, month: 10, groups: [] } });
    render(<PayBillsSheet open onClose={vi.fn()} year={2026} month={10} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('panel')).toHaveTextContent('2026-10 select:true headless:true');
  });

  it('shows a loading message while the budget loads', () => {
    mockSummary({ isLoading: true });
    render(<PayBillsSheet open onClose={vi.fn()} year={2026} month={10} />);
    expect(screen.getByText(/loading bills/i)).toBeInTheDocument();
  });

  it('shows an error message when the budget fails to load', () => {
    mockSummary({ isError: true });
    render(<PayBillsSheet open onClose={vi.fn()} year={2026} month={10} />);
    expect(screen.getByText(/couldn't load your bills/i)).toBeInTheDocument();
  });
});
