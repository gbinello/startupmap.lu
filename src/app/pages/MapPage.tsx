import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router';
import { MapPin, X, List, SlidersHorizontal, Check } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { Entity } from '@/lib/supabase';
import { ENTITY_TYPE_LABELS, SECTORS, STAGE_LABELS, LU_CITIES, getInitials } from '@/lib/utils';

const LU_CENTER: [number, number] = [49.8153, 6.1296];

function createEntityIcon(entity: Entity) {
  const colorMap: Record<string, string> = {
    startup: '#3B82F6',
    investor: '#16A34A',
    accelerator: '#D97706',
    service_provider: '#64748B',
  };
  const color = colorMap[entity.type] ?? '#6B5CE7';
  const initials = getInitials(entity.name);

  const html = `
    <div style="
      width:32px;height:32px;
      background:white;
      border:2px solid ${color};
      border-radius:8px;
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:600;color:${color};
      font-family:Inter,sans-serif;
      box-shadow:0 2px 6px rgba(0,0,0,0.12);
      cursor:pointer;
    ">${initials}</div>`;

  return L.divIcon({ html, className: '', iconSize: [32, 32], iconAnchor: [16, 32] });
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

export default function MapPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selected, setSelected] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const typeFilter = searchParams.get('type') || '';
  const sectorParams = searchParams.getAll('sector');
  const stageParams = searchParams.getAll('stage');
  const cityParams = searchParams.getAll('city');
  const activeFilters = sectorParams.length + stageParams.length + cityParams.length;

  useEffect(() => { loadEntities(); }, [typeFilter, sectorParams.join(','), stageParams.join(','), cityParams.join(',')]);

  async function loadEntities() {
    setLoading(true);
    let q = supabase
      .from('entities')
      .select('*, startup_details(*), investor_details(*)')
      .eq('visible', true)
      .not('lat', 'is', null);

    if (typeFilter) q = q.eq('type', typeFilter);

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
  }

  function toggleParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    const current = searchParams.getAll(key);
    if (current.includes(value)) {
      current.filter(v => v !== value).forEach(v => next.append(key, v));
    } else {
      current.forEach(v => next.append(key, v));
      next.append(key, value);
    }
    setSearchParams(next);
  }

  function clearFilters() {
    const next = new URLSearchParams(searchParams);
    next.delete('sector'); next.delete('stage'); next.delete('city');
    setSearchParams(next);
  }

  const TYPE_TABS = [
    { value: '', label: 'All' },
    { value: 'startup', label: 'Startups' },
    { value: 'investor', label: 'Investors' },
    { value: 'accelerator', label: 'Accelerators' },
  ];

  return (
    <>
      <Helmet>
        <title>Luxembourg Startup Ecosystem Map | startupmap.lu</title>
        <meta name="description" content="Interactive map of Luxembourg's startup ecosystem. Explore startups, investors and accelerators by location across the Grand Duchy." />
        <meta property="og:title" content="Luxembourg Startup Ecosystem Map | startupmap.lu" />
        <meta property="og:description" content="Interactive map of Luxembourg's startup ecosystem. Explore startups, investors and accelerators by location." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://startupmap.lu/map" />
        <meta property="og:site_name" content="startupmap.lu" />
        <meta name="twitter:card" content="summary" />
      </Helmet>

      <div className="relative" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <h1 className="sr-only">Luxembourg Startup Ecosystem Map</h1>

        {/* Floating top bar */}
        <div className="absolute top-3 left-3 right-3 z-[1001] bg-white border border-[var(--border)] rounded-[20px] px-3 py-2 flex flex-col gap-1.5">
          {/* Row 1: type tabs */}
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {TYPE_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  if (tab.value) next.set('type', tab.value); else next.delete('type');
                  setSearchParams(next);
                }}
                className={`shrink-0 px-3 py-1 text-xs rounded-[var(--radius)] transition-[color,background-color,scale] active:scale-[0.96] ${
                  typeFilter === tab.value
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--foreground-secondary)] hover:bg-[var(--surface)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Row 2: actions */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[var(--foreground-muted)]">
              {loading ? 'Loading…' : `${entities.length} on map`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltersOpen(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius)] border transition-colors ${
                  filtersOpen || activeFilters > 0
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:bg-[var(--surface)]'
                }`}
              >
                <SlidersHorizontal size={11} />
                Filters
                {activeFilters > 0 && (
                  <span className="bg-white text-[var(--primary)] rounded-full w-4 h-4 flex items-center justify-center font-semibold text-[10px]">
                    {activeFilters}
                  </span>
                )}
              </button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/directory" className="gap-1">
                  <List size={12} />
                  <span className="hidden sm:inline">List</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Map — full area */}
        <div className="absolute inset-0">
          <div className="w-full h-full">
            <MapContainer
              center={LU_CENTER}
              zoom={10}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              {entities.map(e => (
                e.lat && e.lng ? (
                  <Marker
                    key={e.id}
                    position={[e.lat, e.lng]}
                    icon={createEntityIcon(e)}
                    eventHandlers={{ click: () => setSelected(e) }}
                  />
                ) : null
              ))}
            </MapContainer>
          </div>

          {/* Filter panel — side panel on desktop, bottom sheet on mobile */}
          {filtersOpen && (
            <>
              {/* Mobile backdrop */}
              <div
                className="sm:hidden absolute inset-0 bg-black/20 z-[1001]"
                onClick={() => setFiltersOpen(false)}
              />
              <aside className={`
                absolute z-[1002] bg-white border border-[var(--border)] flex flex-col
                sm:top-[100px] sm:left-3 sm:bottom-3 sm:w-64 sm:rounded-[24px]
                bottom-0 left-0 right-0 rounded-t-[24px] max-h-[70vh]
              `}>
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--border)]">
                  <span className="text-sm font-medium text-[var(--foreground)]">Filters</span>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="size-7 flex items-center justify-center rounded hover:bg-[var(--surface)] text-[var(--foreground-muted)]"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                  <FilterGroup
                    label="Sector"
                    options={SECTORS}
                    selected={sectorParams}
                    onToggle={v => toggleParam('sector', v)}
                  />
                  {(!typeFilter || typeFilter === 'startup') && (
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
                </div>
                {activeFilters > 0 && (
                  <div className="px-4 py-3 border-t border-[var(--border)]">
                    <button
                      onClick={clearFilters}
                      className="w-full text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)] py-1.5"
                    >
                      Clear {activeFilters} filter{activeFilters !== 1 ? 's' : ''}
                    </button>
                  </div>
                )}
              </aside>
            </>
          )}

          {/* Entity detail panel */}
          {selected && (
            <aside className="absolute top-[60px] right-3 bottom-3 w-72 bg-white border border-[var(--border)] rounded-[24px] overflow-y-auto animate-fade-in z-[1001]">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--primary-light)] text-[var(--primary)] font-semibold text-sm flex items-center justify-center">
                    {getInitials(selected.name)}
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="size-8 flex items-center justify-center rounded hover:bg-[var(--surface)] text-[var(--foreground-muted)] transition-[background-color,scale] active:scale-[0.96]"
                  >
                    <X size={14} />
                  </button>
                </div>
                <h3 className="font-semibold text-[var(--foreground)] text-sm mb-1">{selected.name}</h3>
                {selected.tagline && <p className="text-xs text-[var(--foreground-secondary)] mb-3 leading-relaxed">{selected.tagline}</p>}

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant={selected.type as any}>{ENTITY_TYPE_LABELS[selected.type]}</Badge>
                  {selected.startup_details?.stage && (
                    <Badge variant={selected.startup_details.stage as any}>
                      {selected.startup_details.stage}
                    </Badge>
                  )}
                </div>

                {selected.city && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-secondary)] mb-1">
                    <MapPin size={11} />
                    {selected.city}
                  </div>
                )}

                <div className="mt-4">
                  <Button size="sm" className="w-full" asChild>
                    <Link to={`/entity/${selected.slug || selected.id}`}>View profile</Link>
                  </Button>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
