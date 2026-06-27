import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router';
import { Briefcase, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { Job } from '@/lib/supabase';
import { formatDate, getInitials } from '@/lib/utils';

const JOB_TYPES = ['', 'full-time', 'part-time', 'contract', 'internship'];
const REMOTE_OPTS = ['', 'yes', 'hybrid', 'no'];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [remoteFilter, setRemoteFilter] = useState('');

  useEffect(() => { loadJobs(); }, [typeFilter, remoteFilter]);

  async function loadJobs() {
    setLoading(true);
    let q = supabase
      .from('jobs')
      .select('*, entity:entity_id(id, name, slug, logo_url, type, city)')
      .eq('active', true)
      .order('posted_at', { ascending: false });

    if (typeFilter) q = q.eq('type', typeFilter);
    if (remoteFilter) q = q.eq('remote', remoteFilter);

    const { data } = await q;
    setJobs((data as Job[]) || []);
    setLoading(false);
  }

  return (
    <>
      <Helmet>
        <title>Jobs at Luxembourg Startups & Scaleups | startupmap.lu</title>
        <meta name="description" content="Browse open positions at Luxembourg startups and scaleups. Find full-time, part-time, remote and hybrid roles across tech, fintech, AI and more." />
        <meta property="og:title" content="Jobs at Luxembourg Startups | startupmap.lu" />
        <meta property="og:description" content="Browse open positions at Luxembourg startups and scaleups. Remote, hybrid and on-site roles." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://startupmap.lu/jobs" />
        <meta property="og:site_name" content="startupmap.lu" />
        <meta name="twitter:card" content="summary" />
      </Helmet>

      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-5">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Jobs</h1>
          <p className="text-sm text-[var(--foreground-secondary)]">Open positions at Luxembourg startups and scaleups</p>

          <div className="flex flex-wrap items-center gap-2 mt-5">
            <div className="flex gap-1 flex-wrap">
              {JOB_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 text-xs rounded-full border capitalize transition-colors ${
                    typeFilter === t
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'border-[var(--border-strong)] text-[var(--foreground-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                  }`}
                >
                  {t || 'All types'}
                </button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap ml-auto">
              {REMOTE_OPTS.map(r => (
                <button
                  key={r}
                  onClick={() => setRemoteFilter(r)}
                  className={`px-3 py-1 text-xs rounded-full border capitalize transition-colors ${
                    remoteFilter === r
                      ? 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {r ? (r === 'yes' ? 'Remote' : r === 'no' ? 'On-site' : 'Hybrid') : 'Any location'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-[var(--surface)] rounded-[var(--radius-lg)] animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase size={32} className="mx-auto text-[var(--foreground-muted)] mb-3" />
            <p className="text-sm text-[var(--foreground-secondary)]">No jobs found matching your filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[var(--foreground-muted)] mb-4">{jobs.length} open position{jobs.length !== 1 ? 's' : ''}</p>
            {jobs.map(job => <JobRow key={job.id} job={job} />)}
          </div>
        )}
      </div>
    </>
  );
}

function JobRow({ job }: { job: Job }) {
  const entity = job.entity;

  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-[var(--border)] rounded-[var(--radius-lg)] hover:border-[var(--border-strong)] hover:shadow-sm transition-all group">
      {/* Company logo */}
      <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--primary-light)] text-[var(--primary)] font-semibold text-sm flex items-center justify-center shrink-0 border border-[var(--border)]">
        {entity?.name ? getInitials(entity.name) : '?'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <h3 className="text-sm font-medium text-[var(--foreground)]">{job.title}</h3>
          {job.type && <Badge variant="default" className="capitalize">{job.type.replace('-', ' ')}</Badge>}
          {job.remote === 'yes' && <Badge variant="success">Remote</Badge>}
          {job.remote === 'hybrid' && <Badge variant="warning">Hybrid</Badge>}
        </div>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {entity?.name && (
            <Link
              to={`/entity/${entity.slug || entity.id}`}
              className="text-xs text-[var(--primary)] hover:underline"
              onClick={e => e.stopPropagation()}
            >
              {entity.name}
            </Link>
          )}
          {(job.location || entity?.city) && (
            <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
              <MapPin size={11} /> {job.location || entity?.city}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
            <Clock size={11} /> {formatDate(job.posted_at)}
          </span>
          {job.salary_min && job.salary_max && (
            <span className="text-xs text-[var(--foreground-secondary)]">
              €{(job.salary_min / 1000).toFixed(0)}k–€{(job.salary_max / 1000).toFixed(0)}k
            </span>
          )}
        </div>
      </div>

      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-strong)] rounded-[var(--radius)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          onClick={e => e.stopPropagation()}
        >
          Apply <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}
