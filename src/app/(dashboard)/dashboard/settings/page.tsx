import { SettingsPageClient } from './SettingsPage.client';
import { Suspense } from 'react';

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsPageClient />
    </Suspense>
  );
}
