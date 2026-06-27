import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { Search, ArrowRight, Building2, TrendingUp, Zap, Users, MapPin, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import EntityCard from '../components/EntityCard';
import { supabase } from '@/lib/supabase';
import type { Entity } from '@/lib/supabase';

const ENTITY_TYPES = [
  { key: 'startup', label: 'Startups', icon: Zap, color: 'text-blue-600 bg-blue-50' },
  { key: 'investor', label: 'Investors', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
  { key: 'accelerator', label: 'Accelerators', icon: Building2, color: 'text-amber-600 bg-amber-50' },
  { key: 'service_provider', label: 'Service Providers', icon: Users, color: 'text-slate-600 bg-slate-100' },
];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [featured, setFeatured] = useState<Entity[]>([]);
  const [counts, setCounts] = useState({ startup: 0, investor: 0, accelerator: 0, service_provider: 0, events: 0, jobs: 0 });
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function loadData() {
    const [{ data: ents }, { data: featuredEnts }] = await Promise.all([
      supabase.from('entities').select('id, type, name').eq('visible', true),
      supabase
        .from('entities')
        .select('*, startup_details(*), investor_details(*)')
        .eq('visible', true)
        .eq('featured', true)
        .limit(6),
    ]);

    if (ents) {
      const c = { startup: 0, investor: 0, accelerator: 0, service_provider: 0, events: 0, jobs: 0 };
      ents.forEach((e: any) => { if (e.type in c) (c as any)[e.type]++; });
      setCounts(c);
      setEntities(ents as any[]);
    }
    if (featuredEnts) setFeatured(featuredEnts as any[]);
    setLoading(false);
  }

  const q = query.trim().toLowerCase();
  const suggestions = q.length >= 2
    ? entities.filter(e => e.name.toLowerCase().includes(q)).slice(0, 6)
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/directory?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      <Helmet>
        <title>startupmap.lu — Luxembourg's startup ecosystem</title>
        <meta name="description" content="Discover startups, investors, accelerators, service providers, events and open jobs across the Grand Duchy of Luxembourg." />
        <meta property="og:title" content="startupmap.lu — Luxembourg's startup ecosystem" />
        <meta property="og:description" content="Discover startups, investors, accelerators, service providers, events and open jobs across the Grand Duchy of Luxembourg." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://startupmap.lu/" />
        <meta property="og:image" content="https://startupmap.lu/og-image.png" />
        <meta property="og:site_name" content="startupmap.lu" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="startupmap.lu — Luxembourg's startup ecosystem" />
        <meta name="twitter:description" content="Discover startups, investors, accelerators, service providers, events and open jobs across the Grand Duchy of Luxembourg." />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'startupmap.lu',
          url: 'https://startupmap.lu',
          description: "Luxembourg's startup ecosystem directory — startups, investors, accelerators, events and jobs.",
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: 'https://startupmap.lu/directory?q={search_term_string}' },
            'query-input': 'required name=search_term_string',
          },
        })}</script>
      </Helmet>

      {/* Hero */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-1.5 bg-[var(--primary-light)] text-[var(--primary)] rounded-full px-3 py-1 text-xs font-medium mb-6">
            <MapPin size={12} />
            Grand Duchy of Luxembourg
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--foreground)] leading-tight mb-4">
            Luxembourg's startup<br />ecosystem, mapped
          </h1>
          <p className="text-base text-[var(--foreground-secondary)] max-w-xl mx-auto mb-8 leading-relaxed">
            Discover startups, investors, accelerators, service providers, events and open jobs across the Grand Duchy.
          </p>

          {/* Search */}
          <div ref={searchRef} className="relative max-w-xl mx-auto">
            <form onSubmit={handleSearch}>
              <div className="relative flex items-center">
                <Search size={16} className="absolute left-3.5 text-[var(--foreground-muted)] pointer-events-none" />
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowDropdown(e.target.value.trim().length >= 2); }}
                  placeholder="Search startups, investors, accelerators…"
                  className="w-full h-11 pl-10 pr-32 rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 h-7 px-3 rounded-[var(--radius)] bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {showDropdown && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[var(--border-strong)] rounded-[var(--radius-lg)] shadow-lg overflow-hidden z-50 animate-fade-in">
                {suggestions.map(s => (
                  <Link
                    key={s.id}
                    to={`/entity/${s.slug || s.id}`}
                    onClick={() => { setShowDropdown(false); setQuery(''); }}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[var(--surface)] transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-[var(--primary-light)] flex items-center justify-center text-[10px] font-medium text-[var(--primary)] shrink-0">
                      {s.name[0]}
                    </div>
                    <span className="text-sm text-[var(--foreground)]">{s.name}</span>
                    <span className="ml-auto text-xs text-[var(--foreground-muted)] capitalize">{s.type.replace('_', ' ')}</span>
                  </Link>
                ))}
                <Link
                  to={`/directory?q=${encodeURIComponent(query)}`}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-[var(--border)] text-xs text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
                >
                  View all results for "{query}" <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[var(--border)]">
            {ENTITY_TYPES.map(({ key, label, icon: Icon, color }) => (
              <Link
                key={key}
                to={`/directory?type=${key}`}
                className="flex items-center gap-3 px-4 sm:px-6 py-4 hover:bg-white transition-colors group"
              >
                <div className={`w-8 h-8 rounded-[var(--radius)] flex items-center justify-center ${color}`}>
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--foreground)] leading-none tabular-nums">
                    {(counts as any)[key] || '—'}
                  </p>
                  <p className="text-xs text-[var(--foreground-secondary)] mt-0.5">{label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
          {[
            { to: '/map', icon: MapPin, label: 'Ecosystem map', desc: 'See all entities on an interactive map' },
            { to: '/events', icon: Calendar, label: 'Upcoming events', desc: 'Conferences, meetups and hackathons' },
            { to: '/jobs', icon: Zap, label: 'Open positions', desc: 'Jobs at Luxembourg startups' },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-start gap-3 p-4 bg-white border border-[var(--border)] rounded-[24px] hover:border-[var(--border-strong)] hover:shadow-sm transition-[border-color,box-shadow] group"
            >
              <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
                <item.icon size={15} />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{item.label}</p>
                <p className="text-xs text-[var(--foreground-secondary)] mt-0.5">{item.desc}</p>
              </div>
              <ArrowRight size={14} className="ml-auto text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition-colors mt-0.5" />
            </Link>
          ))}
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Featured</h2>
              <Link to="/directory" className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featured.map(e => (
                <EntityCard key={e.id} entity={e} />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-[var(--primary-light)] border border-[var(--primary-light-hover)] rounded-[var(--radius-xl)] p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Is your company missing?
          </h2>
          <p className="text-sm text-[var(--foreground-secondary)] mb-5 max-w-md mx-auto">
            Submit your startup, investor or accelerator profile and join Luxembourg's startup directory.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild>
              <Link to="/submit">Submit a listing</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/profile">Claim your profile</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
