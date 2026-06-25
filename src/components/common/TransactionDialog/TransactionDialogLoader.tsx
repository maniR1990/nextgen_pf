import 'server-only';
// Import directly — NOT via the barrel index (which is client-safe and excludes this file)
import {
  getCategoryOptions,
  getPaymentSourceOptions,
  getSinkingFundOptions,
} from '@/lib/data/transaction-options';
import { TransactionDialog } from './TransactionDialog';
import type { TransactionDialogProps } from './TransactionDialog';

interface TransactionDialogLoaderProps extends Omit<TransactionDialogProps, 'initialOptions'> {
  userId: string;
}

export async function TransactionDialogLoader({ userId, ...props }: TransactionDialogLoaderProps) {
  const [sources, categories, sinkingFunds] = await Promise.all([
    getPaymentSourceOptions(userId),
    getCategoryOptions(userId),
    getSinkingFundOptions(userId),
  ]);

  return <TransactionDialog {...props} initialOptions={{ sources, categories, sinkingFunds }} />;
}
