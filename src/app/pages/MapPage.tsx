import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router';
import { MapPin, X, List } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { Entity } from '@/lib/supabase';
import { ENTITY_TYPE_LABELS, getInitials } from '@/lib/utils';

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

export default function MapPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selected, setSelected] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = searchParams.get('type') || '';

  useEffect(() => { loadEntities(); }, [typeFilter]);

  async function loadEntities() {
    setLoading(true);
    let q = supabase
      .from('entities')
      .select('*, startup_details(*), investor_details(*)')
      .eq('visible', true)
      .not('lat', 'is', null);

    if (typeFilter) q = q.eq('type', typeFilter);

    const { data } = await q;
    setEntities((data as Entity[]) || []);
    setLoading(false);
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
        <title>Map — startupmap.lu</title>
      </Helmet>

      <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem)' }}>
        {/* Top bar */}
        <div className="bg-white border-b border-[var(--border)] px-4 py-2 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-0.5">
            {TYPE_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  if (tab.value) next.set('type', tab.value); else next.delete('type');
                  setSearchParams(next);
                }}
                className={`px-3 py-1 text-xs rounded-[var(--radius)] transition-colors ${
                  typeFilter === tab.value
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--foreground-secondary)] hover:bg-[var(--surface)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--foreground-muted)]">
              {loading ? 'Loading…' : `${entities.length} on map`}
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/directory" className="gap-1">
                <List size={12} /> List view
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Map */}
          <div className="flex-1 relative">
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
                  >
                    <Popup>
                      <div style={{ minWidth: 160 }}>
                        <p style={{ fontWeight: 600, marginBottom: 2 }}>{e.name}</p>
                        <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{e.tagline}</p>
                        <a
                          href={`/entity/${e.slug || e.id}`}
                          style={{ fontSize: 12, color: '#6B5CE7' }}
                        >
                          View profile →
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              ))}
            </MapContainer>
          </div>

          {/* Selected entity panel */}
          {selected && (
            <aside className="w-72 bg-white border-l border-[var(--border)] overflow-y-auto animate-fade-in">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--primary-light)] text-[var(--primary)] font-semibold text-sm flex items-center justify-center">
                    {getInitials(selected.name)}
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1 rounded hover:bg-[var(--surface)] text-[var(--foreground-muted)]"
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
