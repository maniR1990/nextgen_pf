import { redirect } from 'next/navigation';

export default function SinkingFundsPage() {
  redirect('/dashboard/settings?tab=funds');
}
