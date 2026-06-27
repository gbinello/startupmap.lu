import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { Search, SlidersHorizontal, X, Map, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import EntityCard from '../components/EntityCard';
import { supabase } from '@/lib/supabase';
import type { Entity, EntityType } from '@/lib/supabase';
import { ENTITY_TYPE_LABELS, SECTORS, STAGE_LABELS, LU_CITIES } from '@/lib/utils';

const TYPE_TABS = [
  { value: '', label: 'All' },
  { value: 'startup', label: 'Startups' },
  { value: 'investor', label: 'Investors' },
  { value: 'accelerator', label: 'Accelerators' },
  { value: 'service_provider', label: 'Service Providers' },
];

const TYPE_H1: Record<string, string> = {
  startup: 'Luxembourg Startups',
  investor: 'Luxembourg Investors & VCs',
  accelerator: 'Luxembourg Accelerators',
  service_provider: 'Luxembourg Service Providers',
};

const TYPE_DESC: Record<string, string> = {
  startup: 'Browse startups building in Luxembourg. Filter by sector, stage and city.',
  investor: 'Luxembourg-based VCs, angel investors and family offices. Filter by stage and sector focus.',
  accelerator: 'Accelerators and incubators supporting startups in Luxembourg.',
  service_provider: 'Law firms, accountants, recruiters and other service providers for Luxembourg startups.',
};

export default function DirectoryPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const typeParam = searchParams.get('type') || '';
  const queryParam = searchParams.get('q') || '';
  const sectorParams = searchParams.getAll('sector');
  const stageParams = searchParams.getAll('stage');
  const cityParams = searchParams.getAll('city');

  const [localQuery, setLocalQuery] = useState(queryParam);
  useEffect(() => { setLocalQuery(queryParam); }, [queryParam]);

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('entities')
      .select('*, startup_details(*), investor_details(*)')
      .eq('visible', true)
      .order('featured', { ascending: false })
      .order('name');

    if (typeParam) q = q.eq('type', typeParam as EntityType);
    if (queryParam) q = q.ilike('name', `%${queryParam}%`);

    const { data } = await q;
    let results = (data as Entity[]) || [];

    if (sectorParams.length > 0)
      results = results.filter(e => sectorParams.includes(e.startup_details?.sector ?? ''));
    if (stageParams.length > 0)
      results = results.filter(e => stageParams.includes(e.startup_details?.stage ?? ''));
    if (cityParams.length > 0)
      results = results.filter(e => cityParams.some(c => e.city?.toLowerCase().includes(c.toLowerCase())));

    setEntities(results);
    setLoading(false);
  }, [typeParam, queryParam, sectorParams.join(','), stageParams.join(','), cityParams.join(',')]);

  useEffect(() => { fetchEntities(); }, [fetchEntities]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  };

  const toggleParam = (key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const current = next.getAll(key);
      next.delete(key);
      if (current.includes(value)) {
        current.filter(v => v !== value).forEach(v => next.append(key, v));
      } else {
        [...current, value].forEach(v => next.append(key, v));
      }
      return next;
    });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (typeParam) next.set('type', typeParam);
    if (queryParam) next.set('q', queryParam);
    setSearchParams(next);
  };

  const activeFilters = sectorParams.length + stageParams.length + cityParams.length;

  const filterContent = (
    <>
      <FilterGroup
        label="Sector"
        options={SECTORS}
        selected={sectorParams}
        onToggle={v => toggleParam('sector', v)}
      />
      {(!typeParam || typeParam === 'startup') && (
        <FilterGroup
          label="Stage"
          options={Object.keys(STAGE_LABELS)}
          labelFn={v => STAGE_LABELS[v]}
          selected={stageParams}
          onToggle={v => toggleParam('stage', v)}
        />
      )}
      <FilterGroup
        label="City"
        options={LU_CITIES}
        selected={cityParams}
        onToggle={v => toggleParam('city', v)}
      />
    </>
  );

  return (
    <>
      <Helmet>
        <title>{typeParam ? `${TYPE_H1[typeParam] ?? 'Directory'} | startupmap.lu` : 'Luxembourg Startup Directory — Startups, Investors & Accelerators | startupmap.lu'}</title>
        <meta name="description" content={TYPE_DESC[typeParam] ?? 'Browse Luxembourg startups, investors, accelerators and service providers. Filter by sector, stage and city.'} />
        <link rel="canonical" href={`https://startupmap.lu${location.pathname}${typeParam ? `?type=${typeParam}` : ''}`} />
        <meta property="og:title" content={typeParam ? `${TYPE_H1[typeParam] ?? 'Directory'} | startupmap.lu` : 'Luxembourg Startup Directory | startupmap.lu'} />
        <meta property="og:description" content={TYPE_DESC[typeParam] ?? 'Browse Luxembourg startups, investors, accelerators and service providers.'} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://startupmap.lu${location.pathname}${typeParam ? `?type=${typeParam}` : ''}`} />
        <meta property="og:site_name" content="startupmap.lu" />
        <meta name="twitter:card" content="summary" />
      </Helmet>

      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-[var(--foreground)] pt-5 pb-1">
            {typeParam ? (TYPE_H1[typeParam] ?? 'Directory') : 'Luxembourg Startup Directory'}
          </h1>
          <p className="text-sm text-[var(--foreground-secondary)] pb-2">
            {TYPE_DESC[typeParam] ?? 'Browse Luxembourg startups, investors, accelerators and service providers. Filter by sector, stage and city.'}
          </p>

          {/* Type tabs */}
          <div className="flex items-center gap-0.5 pt-4 overflow-x-auto">
            {TYPE_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setParam('type', tab.value)}
                className={`shrink-0 px-3 py-1.5 text-sm rounded-[var(--radius)] transition-colors ${
                  typeParam === tab.value
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search + actions */}
          <div className="flex items-center gap-2 py-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none" />
              <form onSubmit={e => { e.preventDefault(); setParam('q', localQuery); }}>
                <input
                  value={localQuery}
                  onChange={e => setLocalQuery(e.target.value)}
                  onBlur={() => setParam('q', localQuery)}
                  placeholder="Search by name…"
                  className="w-full h-8 pl-8 pr-3 rounded-[var(--radius)] border border-[var(--border-strong)] bg-white text-sm placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                />
              </form>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="gap-1.5 shrink-0"
            >
              <SlidersHorizontal size={13} />
              Filters
              {activeFilters > 0 && (
                <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[10px] flex items-center justify-center tabular-nums">
                  {activeFilters}
                </span>
              )}
            </Button>

            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link to="/map" className="gap-1.5">
                <Map size={13} />
                <span className="hidden sm:inline">Map</span>
              </Link>
            </Button>

            {activeFilters > 0 && (
              <button onClick={clearFilters} className="shrink-0 text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)] flex items-center gap-1">
                <X size={12} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilters > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-3">
              {sectorParams.map(s => (
                <button key={s} onClick={() => toggleParam('sector', s)} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--primary-light)] text-[var(--primary)] rounded-full hover:bg-[var(--primary-light-hover)]">
                  {s} <X size={10} />
                </button>
              ))}
              {stageParams.map(s => (
                <button key={s} onClick={() => toggleParam('stage', s)} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--primary-light)] text-[var(--primary)] rounded-full hover:bg-[var(--primary-light-hover)]">
                  {STAGE_LABELS[s] ?? s} <X size={10} />
                </button>
              ))}
              {cityParams.map(c => (
                <button key={c} onClick={() => toggleParam('city', c)} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--primary-light)] text-[var(--primary)] rounded-full hover:bg-[var(--primary-light-hover)]">
                  {c} <X size={10} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter overlay */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white sm:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--foreground)]">Filters</p>
            <button
              onClick={() => setFiltersOpen(false)}
              className="size-9 flex items-center justify-center rounded-full hover:bg-[var(--surface)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {filterContent}
          </div>
          <div className="px-4 py-3 border-t border-[var(--border)] bg-white flex gap-2">
            {activeFilters > 0 && (
              <Button variant="outline" className="shrink-0" onClick={clearFilters}>
                Clear {activeFilters}
              </Button>
            )}
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              Show {loading ? '…' : `${entities.length} result${entities.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters sidebar — desktop only */}
          {filtersOpen && (
            <aside className="hidden sm:block w-52 shrink-0">
              <div className="sticky top-20 space-y-5">
                {filterContent}
              </div>
            </aside>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[var(--foreground-secondary)]">
                {loading ? 'Loading…' : `${entities.length} ${entities.length === 1 ? 'result' : 'results'}`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-28 bg-[var(--surface)] rounded-[var(--radius-lg)] animate-pulse" />
                ))}
              </div>
            ) : entities.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-[var(--foreground-secondary)] mb-3">No results found</p>
                <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {entities.map(e => (
                  <EntityCard key={e.id} entity={e} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function FilterGroup({
  label, options, selected, onToggle, labelFn,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  labelFn?: (v: string) => string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--foreground)] mb-2">{label}</p>
      <div className="space-y-0.5">
        {options.map(opt => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={`w-full text-left text-xs px-2 py-1.5 rounded-[var(--radius-sm)] transition-colors flex items-center gap-2 ${
                isSelected
                  ? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium'
                  : 'text-[var(--foreground-secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]'
              }`}
            >
              <span className={`size-3.5 shrink-0 rounded border flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-[var(--primary)] border-[var(--primary)]'
                  : 'border-[var(--border-strong)]'
              }`}>
                {isSelected && <Check size={9} className="text-white" strokeWidth={3} />}
              </span>
              {labelFn ? labelFn(opt) : opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
