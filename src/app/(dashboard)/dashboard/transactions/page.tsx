import { TransactionList } from './_components/TransactionList.client';
import { Suspense } from 'react';

export const metadata = {
  title: 'Transactions | PersonalFi',
};

// Deliberately non-async: options (categories, accounts, sinking funds) are
// fetched client-side by TransactionDialog when the modal first opens.
// This makes the page render instantly — no DB round-trips before first byte.
export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionList />
    </Suspense>
  );
}
