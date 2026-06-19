import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { Search, SlidersHorizontal, X, Map, List } from 'lucide-react';
import { Button } from '../components/ui/button';
import EntityCard from '../components/EntityCard';
import { Badge } from '../components/ui/badge';
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

export default function DirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const typeParam = searchParams.get('type') || '';
  const queryParam = searchParams.get('q') || '';
  const sectorParam = searchParams.get('sector') || '';
  const stageParam = searchParams.get('stage') || '';
  const cityParam = searchParams.get('city') || '';

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
    if (cityParam) q = q.ilike('city', `%${cityParam}%`);

    const { data } = await q;
    let results = (data as Entity[]) || [];

    if (sectorParam) results = results.filter(e => e.startup_details?.sector === sectorParam);
    if (stageParam) results = results.filter(e => e.startup_details?.stage === stageParam);

    setEntities(results);
    setLoading(false);
  }, [typeParam, queryParam, sectorParam, stageParam, cityParam]);

  useEffect(() => { fetchEntities(); }, [fetchEntities]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());

  const activeFilters = [sectorParam, stageParam, cityParam].filter(Boolean).length;

  return (
    <>
      <Helmet>
        <title>Directory — startupmap.lu</title>
      </Helmet>

      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              className="gap-1.5"
            >
              <SlidersHorizontal size={13} />
              Filters
              {activeFilters > 0 && (
                <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[10px] flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link to="/map" className="gap-1.5">
                <Map size={13} />
                Map
              </Link>
            </Button>

            {activeFilters > 0 && (
              <button onClick={clearFilters} className="text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)] flex items-center gap-1">
                <X size={12} />
                Clear
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilters > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-3">
              {sectorParam && (
                <button onClick={() => setParam('sector', '')} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--primary-light)] text-[var(--primary)] rounded-full hover:bg-[var(--primary-light-hover)]">
                  {sectorParam} <X size={10} />
                </button>
              )}
              {stageParam && (
                <button onClick={() => setParam('stage', '')} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--primary-light)] text-[var(--primary)] rounded-full hover:bg-[var(--primary-light-hover)]">
                  {STAGE_LABELS[stageParam] ?? stageParam} <X size={10} />
                </button>
              )}
              {cityParam && (
                <button onClick={() => setParam('city', '')} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--primary-light)] text-[var(--primary)] rounded-full hover:bg-[var(--primary-light-hover)]">
                  {cityParam} <X size={10} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters sidebar */}
          {filtersOpen && (
            <aside className="w-52 shrink-0 animate-fade-in">
              <div className="sticky top-20 space-y-5">
                <FilterGroup
                  label="Sector"
                  options={SECTORS}
                  selected={sectorParam}
                  onSelect={v => setParam('sector', v)}
                />
                {(!typeParam || typeParam === 'startup') && (
                  <FilterGroup
                    label="Stage"
                    options={Object.keys(STAGE_LABELS)}
                    labelFn={v => STAGE_LABELS[v]}
                    selected={stageParam}
                    onSelect={v => setParam('stage', v)}
                  />
                )}
                <FilterGroup
                  label="City"
                  options={LU_CITIES}
                  selected={cityParam}
                  onSelect={v => setParam('city', v)}
                />
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
  label, options, selected, onSelect, labelFn,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  labelFn?: (v: string) => string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--foreground)] mb-2">{label}</p>
      <div className="space-y-0.5">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onSelect(selected === opt ? '' : opt)}
            className={`w-full text-left text-xs px-2 py-1.5 rounded-[var(--radius-sm)] transition-colors ${
              selected === opt
                ? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium'
                : 'text-[var(--foreground-secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]'
            }`}
          >
            {labelFn ? labelFn(opt) : opt}
          </button>
        ))}
      </div>
    </div>
  );
}
