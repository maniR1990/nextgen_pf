import { ToastProvider } from '@/components/common/ToastProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
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
