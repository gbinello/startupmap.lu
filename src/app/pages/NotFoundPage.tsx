import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { Button } from '../components/ui/button';

export default function NotFoundPage() {
  return (
    <>
      <Helmet><title>Not found — startupmap.lu</title></Helmet>
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-widest mb-3">404</p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Page not found</h1>
          <p className="text-sm text-[var(--foreground-secondary)] mb-6">This page doesn't exist or was moved.</p>
          <Button asChild>
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
