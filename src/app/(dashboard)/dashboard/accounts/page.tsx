import { redirect } from 'next/navigation';

export default function AccountsPage() {
  redirect('/dashboard/settings?tab=accounts');
}
