import { Link } from 'react-router';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-sm font-semibold">
              startupmap<span className="text-[var(--primary)]">.lu</span>
            </Link>
            <p className="mt-2 text-xs text-[var(--foreground-secondary)] leading-relaxed">
              The directory of Luxembourg's startup ecosystem — startups, investors,
              accelerators, events and jobs.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--foreground)] mb-3">Discover</p>
            <ul className="space-y-2">
              {[
                { to: '/directory', label: 'All entities' },
                { to: '/directory?type=startup', label: 'Startups' },
                { to: '/directory?type=investor', label: 'Investors' },
                { to: '/directory?type=accelerator', label: 'Accelerators' },
                { to: '/map', label: 'Map view' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--foreground)] mb-3">Opportunities</p>
            <ul className="space-y-2">
              {[
                { to: '/events', label: 'Events' },
                { to: '/jobs', label: 'Open jobs' },
                { to: '/funding', label: 'Funding data' },
                { to: '/about', label: 'About the ecosystem' },
                { to: '/submit', label: 'Submit a listing' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--foreground)] mb-3">Sectors</p>
            <ul className="space-y-2">
              {[
                { to: '/sector/fintech', label: 'Fintech' },
                { to: '/sector/ai-ml', label: 'AI & ML' },
                { to: '/sector/space-tech', label: 'Space Tech' },
                { to: '/sector/logistics', label: 'Logistics' },
                { to: '/sector/healthtech', label: 'Healthtech' },
                { to: '/sector/cleantech', label: 'Cleantech' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--foreground)] mb-3">Account</p>
            <ul className="space-y-2">
              {[
                { to: '/auth', label: 'Sign in' },
                { to: '/auth?mode=signup', label: 'Create account' },
                { to: '/profile', label: 'Claim your profile' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="text-xs text-[var(--foreground-muted)]">
            © {new Date().getFullYear()} startupmap.lu — Built for the Grand Duchy
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]">Privacy</Link>
            <Link to="/terms" className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
