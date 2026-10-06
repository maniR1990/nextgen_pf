'use client';

import { Modal } from '@/components/ui/Modal';
import { PaymentSchedulePanel } from '@/components/common/PaymentSchedulePanel';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface PayBillsSheetProps {
  open: boolean;
  onClose: () => void;
  year: number;
  month: number;
}

/** The Budget page's payment schedule, opened over the Dashboard straight into its
 *  "Select & pay" checklist — same component, so paying here and there can't drift. */
export function PayBillsSheet({ open, onClose, year, month }: PayBillsSheetProps) {
  const { data, isLoading, isError } = useBudgetSummary(year, month, { enabled: open });
  const monthLabel = `${MONTH_LABELS[month - 1]} ${year}`;

  const now = new Date();
  const currentKey = now.getFullYear() * 12 + now.getMonth() + 1;
  const viewKey = year * 12 + month;

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <Modal.Header title="Pay bills" subtitle={monthLabel}>
        <Modal.CloseButton />
      </Modal.Header>
      <Modal.Body>
        {isLoading && <p className="pay-bills-sheet__status">Loading bills…</p>}
        {isError && <p className="pay-bills-sheet__status">Couldn&apos;t load your bills.</p>}
        {data && (
          <PaymentSchedulePanel
            groups={data.groups}
            monthLabel={monthLabel}
            year={year}
            month={month}
            isFutureMonth={viewKey > currentKey}
            headless
            initialSelectMode
          />
        )}
      </Modal.Body>
    </Modal>
  );
}
