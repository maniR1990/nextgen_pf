import { ToastProvider } from '@/components/common/ToastProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { GeistMono } from 'geist/font/mono';
import type { Metadata, Viewport } from 'next';
// Self-hosted variable font — one file covers every weight (100–900) on the wght
// axis, plus its italic counterpart, so there's no per-weight <link>/import to
// maintain as new font-weight tokens get used.
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/inter/wght-italic.css';
import '@/styles/globals.scss';
import '@/styles/tailwind.css';

export const metadata: Metadata = {
  title: 'Log Personal Bills',
  description: 'Track spending, budgets, and sinking funds.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LogPersonalBills',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistMono.variable}>
      <body>
        <AuthProvider>
          <QueryProvider>
            <ToastProvider>{children}</ToastProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
