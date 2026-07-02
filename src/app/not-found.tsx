import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">404</h1>
        <p className="auth-subtitle">Page not found</p>
        <Link href="/" className="btn btn--primary" style={{ marginTop: '1.5rem' }}>
          Go home
        </Link>
      </div>
    </div>
  );
}
