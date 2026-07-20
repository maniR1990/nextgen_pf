import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Log Personal Bills',
    short_name: 'LogPersonalBills',
    description: 'Track spending, budgets, and sinking funds.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      { src: '/icon-192', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512-maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Long-press the home-screen icon (Android) — jumps straight past the dashboard
    // into the log-transaction flow. dashboard/layout.tsx reads quickAction/mode and
    // opens TransactionDialog accordingly. iOS Safari doesn't support shortcuts yet;
    // the base install (icon + standalone launch) still works there regardless.
    shortcuts: [
      {
        name: 'Log expense',
        short_name: 'Log expense',
        url: '/dashboard?quickAction=log',
        icons: [{ src: '/icon-192', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Log bill',
        short_name: 'Log bill',
        url: '/dashboard?quickAction=log&mode=bulk',
        icons: [{ src: '/icon-192', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
