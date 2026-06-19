import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Calendar, MapPin, ExternalLink, Video } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { Event } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

const EVENT_TYPES = ['', 'conference', 'meetup', 'hackathon', 'workshop', 'networking', 'demo-day'];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showPast, setShowPast] = useState(false);

  useEffect(() => { loadEvents(); }, [typeFilter, showPast]);

  async function loadEvents() {
    setLoading(true);
    let q = supabase
      .from('events')
      .select('*')
      .eq('visible', true)
      .order('start_date', { ascending: true });

    if (!showPast) q = q.gte('start_date', new Date().toISOString());
    if (typeFilter) q = q.eq('type', typeFilter);

    const { data } = await q;
    setEvents((data as Event[]) || []);
    setLoading(false);
  }

  const grouped = events.reduce((acc, e) => {
    const month = e.start_date
      ? new Date(e.start_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : 'TBA';
    if (!acc[month]) acc[month] = [];
    acc[month].push(e);
    return acc;
  }, {} as Record<string, Event[]>);

  return (
    <>
      <Helmet><title>Events — startupmap.lu</title></Helmet>

      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-5">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Events</h1>
          <p className="text-sm text-[var(--foreground-secondary)]">Conferences, meetups, hackathons and networking events in Luxembourg</p>

          <div className="flex items-center gap-2 mt-5 flex-wrap">
            {EVENT_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors capitalize ${
                  typeFilter === t
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'border-[var(--border-strong)] text-[var(--foreground-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                }`}
              >
                {t || 'All types'}
              </button>
            ))}
            <button
              onClick={() => setShowPast(!showPast)}
              className={`ml-auto px-3 py-1 text-xs rounded-full border transition-colors ${
                showPast
                  ? 'bg-[var(--surface)] text-[var(--foreground)] border-[var(--border-strong)]'
                  : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)]'
              }`}
            >
              {showPast ? 'Hide past' : 'Show past'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-[var(--surface)] rounded-[var(--radius-lg)] animate-pulse" />
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={32} className="mx-auto text-[var(--foreground-muted)] mb-3" />
            <p className="text-sm text-[var(--foreground-secondary)]">No upcoming events found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([month, monthEvents]) => (
              <div key={month}>
                <h2 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-widest mb-3">{month}</h2>
                <div className="space-y-2">
                  {monthEvents.map(event => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function EventRow({ event }: { event: Event }) {
  const startDate = event.start_date ? new Date(event.start_date) : null;
  const isPast = startDate ? startDate < new Date() : false;

  return (
    <div className={`flex gap-4 p-4 bg-white border border-[var(--border)] rounded-[var(--radius-lg)] hover:border-[var(--border-strong)] transition-all ${isPast ? 'opacity-60' : ''}`}>
      {/* Date block */}
      <div className="w-12 shrink-0 text-center">
        {startDate ? (
          <>
            <p className="text-xs text-[var(--foreground-muted)] uppercase">{startDate.toLocaleDateString('en-GB', { month: 'short' })}</p>
            <p className="text-2xl font-semibold text-[var(--foreground)] leading-none">{startDate.getDate()}</p>
          </>
        ) : (
          <p className="text-xs text-[var(--foreground-muted)]">TBA</p>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <h3 className="text-sm font-medium text-[var(--foreground)]">{event.name}</h3>
          {event.type && (
            <Badge variant="default" className="capitalize">{event.type.replace('-', ' ')}</Badge>
          )}
          {event.virtual && (
            <Badge variant="default" className="flex items-center gap-0.5">
              <Video size={10} /> Virtual
            </Badge>
          )}
        </div>

        {event.description && (
          <p className="text-xs text-[var(--foreground-secondary)] mt-1 line-clamp-2 leading-relaxed">{event.description}</p>
        )}

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
              <MapPin size={11} /> {event.location}
            </span>
          )}
        </div>
      </div>

      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-2 rounded-[var(--radius)] text-[var(--foreground-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface)] transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}
