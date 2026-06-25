import { ToastProvider } from '@/components/common/ToastProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import '@/styles/globals.scss';
import '@/styles/tailwind.css';

export const metadata: Metadata = {
  title: 'NextGen PF',
  description: 'Principal Engineer Architecture — Next.js + MongoDB',
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
