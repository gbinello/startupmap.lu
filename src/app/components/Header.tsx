import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { Search, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const NAV_LINKS = [
  { to: '/directory', label: 'Directory' },
  { to: '/map', label: 'Map' },
  { to: '/events', label: 'Events' },
  { to: '/jobs', label: 'Jobs' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/directory?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
              startupmap
              <span className="text-[var(--primary)]">.lu</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 ml-8">
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm rounded-[var(--radius)] transition-colors ${
                    isActive
                      ? 'text-[var(--foreground)] bg-[var(--surface)]'
                      : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-[var(--radius)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
              aria-label="Search"
            >
              <Search size={16} />
            </button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/submit">Submit</Link>
            </Button>
            {user ? (
              <Button variant="secondary" size="sm" asChild>
                <Link to="/profile">Profile</Link>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-[var(--radius)] text-[var(--foreground-secondary)] hover:bg-[var(--surface)]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Search bar dropdown */}
        {searchOpen && (
          <div className="pb-3 animate-fade-in">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search startups, investors, accelerators…"
                  className="w-full h-9 pl-9 pr-4 rounded-[var(--radius)] border border-[var(--border-strong)] bg-white text-sm placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-white animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 text-sm rounded-[var(--radius)] transition-colors ${
                    isActive
                      ? 'text-[var(--foreground)] bg-[var(--surface)]'
                      : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-2 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link to="/submit" onClick={() => setMenuOpen(false)}>Submit</Link>
              </Button>
              {user ? (
                <Button size="sm" className="flex-1" asChild>
                  <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
                </Button>
              ) : (
                <Button size="sm" className="flex-1" asChild>
                  <Link to="/auth" onClick={() => setMenuOpen(false)}>Sign in</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
