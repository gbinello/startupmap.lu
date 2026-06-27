import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { MapPin, TrendingUp, Users, Zap, Building2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { SECTORS as ALL_SECTORS } from './SectorPage';

const ECOSYSTEM_STATS = [
  { label: 'Startups', value: '200+', icon: Zap },
  { label: 'Investors & VCs', value: '40+', icon: TrendingUp },
  { label: 'Accelerators', value: '10+', icon: Building2 },
  { label: 'Ecosystem members', value: '300+', icon: Users },
];

const FEATURED_SECTORS = ALL_SECTORS.filter(s =>
  ['fintech', 'logistics', 'space-tech', 'ai-ml', 'healthtech', 'cleantech'].includes(s.slug)
);

const SUPPORT = [
  { name: 'Luxinnovation', desc: 'The national innovation agency — first stop for any startup looking for funding, acceleration or soft landing into Luxembourg.' },
  { name: 'Luxembourg-City Incubator (LCI)', desc: 'City of Luxembourg\'s incubation programme for early-stage startups.' },
  { name: 'LIST & SnT', desc: 'Luxembourg Institute of Science and Technology and the University\'s Interdisciplinary Centre for Security, Reliability and Trust — key sources of deep-tech spin-offs.' },
  { name: 'LPEA', desc: 'Luxembourg Private Equity & Venture Capital Association — connects startups with the local VC and PE community.' },
  { name: 'Technoport', desc: 'Incubator and co-working space in Esch-sur-Alzette with a strong hardware and deep-tech focus.' },
];

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About the Luxembourg Startup Ecosystem | startupmap.lu</title>
        <meta name="description" content="Learn about Luxembourg's startup ecosystem — its key sectors (fintech, space, AI, logistics), support organisations, accelerators and why the Grand Duchy is one of Europe's most international startup hubs." />
        <meta property="og:title" content="About the Luxembourg Startup Ecosystem | startupmap.lu" />
        <meta property="og:description" content="Key sectors, support organisations and why Luxembourg punches above its weight as a European startup hub." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://startupmap.lu/about" />
        <meta property="og:site_name" content="startupmap.lu" />
        <meta name="twitter:card" content="summary" />
        <link rel="canonical" href="https://startupmap.lu/about" />
      </Helmet>

      {/* Hero */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
          <div className="inline-flex items-center gap-1.5 bg-[var(--primary-light)] text-[var(--primary)] rounded-full px-3 py-1 text-xs font-medium mb-6">
            <MapPin size={12} />
            Grand Duchy of Luxembourg
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] leading-tight mb-4">
            Luxembourg's startup ecosystem
          </h1>
          <p className="text-base text-[var(--foreground-secondary)] max-w-2xl leading-relaxed mb-8">
            A small country with an outsized startup scene. Luxembourg punches well above its weight as a European tech hub — thanks to a multilingual talent pool, one of the world's highest GDP per capita, a progressive regulatory environment and proximity to Paris, Brussels, Frankfurt and Amsterdam.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link to="/directory">Browse the directory</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/submit">Submit your startup</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {ECOSYSTEM_STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="w-9 h-9 rounded-[var(--radius-lg)] bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto mb-2">
                  <Icon size={16} />
                </div>
                <p className="text-2xl font-semibold text-[var(--foreground)] tabular-nums">{value}</p>
                <p className="text-xs text-[var(--foreground-secondary)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">

        {/* Why Luxembourg */}
        <section>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Why Luxembourg?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Multilingual talent', body: 'Over 70% of the workforce is foreign-born. English, French, German and Luxembourgish are all spoken — teams are naturally international.' },
              { title: 'Financial centre', body: 'Home to 130+ banks and Europe\'s largest investment fund hub. Unmatched access to institutional capital and a regulatory environment built for finance.' },
              { title: 'Strategic location', body: 'Three hours by train to Paris, Brussels, Frankfurt or Amsterdam. Heart of the EU with easy access to 500M consumers.' },
              { title: 'Government support', body: 'Generous R&D tax credits, direct grants via Luxinnovation and a government that actively courts tech companies with programmes like Digital Luxembourg.' },
              { title: 'Quality of life', body: 'Consistently ranked among Europe\'s best cities for quality of life, safety and ease of doing business — a real draw for international founders and talent.' },
              { title: 'EU gateway', body: 'Incorporated in Luxembourg means full access to the EU single market, EU passporting for financial products and an English-language court system (for commercial disputes).' },
            ].map(({ title, body }) => (
              <div key={title} className="p-5 bg-white border border-[var(--border)] rounded-[var(--radius-xl)]">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1.5">{title}</h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Key sectors */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Key sectors</h2>
            <Link to="/directory" className="text-xs text-[var(--primary)] hover:underline">Browse all sectors</Link>
          </div>
          <div className="space-y-3">
            {FEATURED_SECTORS.map(({ slug, name, description }) => (
              <Link
                key={slug}
                to={`/sector/${slug}`}
                className="flex gap-4 p-5 bg-white border border-[var(--border)] rounded-[var(--radius-xl)] hover:border-[var(--primary-border)] hover:shadow-sm transition-[border-color,box-shadow] group block"
              >
                <div className="w-2 shrink-0 rounded-full bg-[var(--primary)] mt-1.5 self-start" style={{ height: '8px' }} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">{name}</h3>
                    <ArrowRight size={12} className="text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity mb-1 shrink-0" />
                  </div>
                  <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed line-clamp-2">{description}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALL_SECTORS.filter(s => !['fintech', 'logistics', 'space-tech', 'ai-ml', 'healthtech', 'cleantech'].includes(s.slug)).map(s => (
              <Link
                key={s.slug}
                to={`/sector/${s.slug}`}
                className="px-3 py-2 text-xs text-[var(--foreground-secondary)] hover:text-[var(--primary)] bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:border-[var(--primary-border)] transition-[color,border-color] text-center"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Support organisations */}
        <section>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Key support organisations</h2>
          <div className="space-y-3">
            {SUPPORT.map(({ name, desc }) => (
              <div key={name} className="p-5 bg-white border border-[var(--border)] rounded-[var(--radius-xl)]">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">{name}</h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--primary-light)] border border-[var(--primary-light-hover)] rounded-[var(--radius-2xl)] p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Explore the ecosystem</h2>
          <p className="text-sm text-[var(--foreground-secondary)] mb-5 max-w-md mx-auto">
            startupmap.lu maps every startup, investor, accelerator, event and job in the Grand Duchy. Free and open to the community.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button asChild>
              <Link to="/directory" className="gap-1.5">Browse directory <ArrowRight size={14} /></Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/submit">Submit a listing</Link>
            </Button>
          </div>
        </section>

      </div>
    </>
  );
}
