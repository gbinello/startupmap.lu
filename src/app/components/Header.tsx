import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { Search, Menu, X, LayoutGrid, Map, TrendingUp, Calendar, Briefcase } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const NAV_LINKS = [
  { to: '/directory', label: 'Directory', icon: LayoutGrid },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/funding', label: 'Funding', icon: TrendingUp },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
    <div className="sticky top-0 z-50 flex justify-center" style={{ padding: scrolled ? '12px 12px 0' : '0 16px' }}>
      {/* Single morphing container */}
      <div
        className="flex items-center w-full"
        style={{
          maxWidth: scrolled ? '760px' : '1200px',
          height: scrolled ? 'auto' : '56px',
          borderRadius: scrolled ? '9999px' : '0px',
          background: scrolled ? 'rgba(255,255,255,0.82)' : 'transparent',
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
          border: scrolled ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
          padding: scrolled ? '6px 10px' : '0',
          boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
          transition: 'max-width 300ms ease-in-out, border-radius 300ms ease-in-out, background 300ms ease-in-out, backdrop-filter 300ms ease-in-out, -webkit-backdrop-filter 300ms ease-in-out, padding 300ms ease-in-out, box-shadow 300ms ease-in-out, border-color 300ms ease-in-out',
        }}
      >
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            startupmap<span className="text-[var(--primary)]">.lu</span>
          </span>
        </Link>

        {/* Nav — inner pill fades away as outer becomes the pill */}
        <nav className="hidden md:flex flex-1 justify-center">
          <div
            className="flex items-center gap-0.5"
            style={{
              background: scrolled ? 'transparent' : 'white',
              border: scrolled ? '1px solid transparent' : '1px solid rgba(0,0,0,0.08)',
              borderRadius: '9999px',
              padding: scrolled ? '0' : '4px 6px',
              transition: 'background 300ms ease-in-out, border-color 300ms ease-in-out, padding 300ms ease-in-out',
            }}
          >
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1 text-sm rounded-full transition-colors ${isActive
                  ? 'text-[var(--foreground)] bg-[var(--surface)]'
                  : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'}`
              }>
                <Icon size={12} />{label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="size-10 flex items-center justify-center rounded-full text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-black/5 transition-[color,background-color,scale] active:scale-[0.96]"
            aria-label="Search"
          >
            <Search size={15} />
          </button>
          {!scrolled && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/submit">Submit</Link>
            </Button>
          )}
          {user
            ? <Button variant="secondary" size="sm" asChild><Link to="/profile">Profile</Link></Button>
            : <Button size="sm" asChild><Link to="/auth">Sign in</Link></Button>
          }
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden ml-auto">
          <button className="size-10 flex items-center justify-center rounded-full text-[var(--foreground-secondary)] hover:bg-black/5 transition-[background-color,scale] active:scale-[0.96]" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Search dropdown */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 px-4 animate-fade-in">
          <div className="max-w-[1200px] mx-auto">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search startups, investors, accelerators…"
                  className="w-full h-9 pl-9 pr-4 rounded-full border border-[var(--border-strong)] bg-white text-sm placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 px-4 animate-fade-in md:hidden">
          <div className="bg-white/90 backdrop-blur-md border border-[var(--border)] rounded-[20px] p-3 space-y-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 text-sm rounded-[var(--radius)] transition-colors ${isActive
                    ? 'text-[var(--foreground)] bg-[var(--surface)]'
                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'}`
                }>
                <Icon size={14} />{label}
              </NavLink>
            ))}
            <div className="pt-2 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link to="/submit" onClick={() => setMenuOpen(false)}>Submit</Link>
              </Button>
              {user
                ? <Button size="sm" className="flex-1" asChild><Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link></Button>
                : <Button size="sm" className="flex-1" asChild><Link to="/auth" onClick={() => setMenuOpen(false)}>Sign in</Link></Button>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
