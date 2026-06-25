import { AUTH } from '@/constants/auth';
import { verifyAccessToken } from '@/lib/auth/jwt';
import {
  getCategoryOptions,
  getPaymentSourceOptions,
  getSinkingFundOptions,
} from '@/lib/data/transaction-options';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { TransactionList } from './_components/TransactionList.client';

export const metadata = {
  title: 'Transactions | PersonalFi',
};

async function getUserIdFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH.COOKIE_ACCESS)?.value;
    if (!token) return null;
    const payload = await verifyAccessToken(token);
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export default async function TransactionsPage() {
  const userId = await getUserIdFromCookies();

  const initialOptions = userId
    ? await Promise.all([
        getPaymentSourceOptions(userId),
        getCategoryOptions(userId),
        getSinkingFundOptions(userId),
      ]).then(([sources, categories, sinkingFunds]) => ({ sources, categories, sinkingFunds }))
    : undefined;

  return (
    <Suspense fallback={<div className="tx-page__content" aria-busy="true" />}>
      <TransactionList initialOptions={initialOptions} />
    </Suspense>
  );
}
