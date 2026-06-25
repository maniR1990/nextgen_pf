import { ROUTES } from '@/constants/routes';
import Link from 'next/link';

export function Header() {
  return (
    <header className="shell-header">
      <div className="shell-header__inner">
        <Link href={ROUTES.DASHBOARD} className="shell-header__brand">
          NextGen PF
        </Link>
        <nav className="shell-header__nav">
          <Link href={ROUTES.DASHBOARD}>Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}
