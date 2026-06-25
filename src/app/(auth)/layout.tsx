import { Card } from '@/components/ui/Card';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page-center">
      <div className="auth-shell">
        <Card variant="feature">{children}</Card>
      </div>
    </main>
  );
}
