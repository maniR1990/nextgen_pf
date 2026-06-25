import { ROUTES } from '@/constants/routes';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="page-home">
      <h1 className="page-home__title">NextGen PF</h1>
      <p className="page-home__subtitle">Next.js + MongoDB · Principal Engineer Architecture</p>
      <div className="page-home__links">
        <Link href={ROUTES.LOGIN} className="page-home__link">
          Login
        </Link>
        <Link href={ROUTES.REGISTER} className="page-home__link">
          Register
        </Link>
        <Link href={ROUTES.DASHBOARD} className="page-home__link">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
