import { useState } from 'react';
import { Link } from 'react-router';
import { Building2, MapPin, TrendingUp, Users, Briefcase, Target } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn, formatCurrency, getInitials, ENTITY_TYPE_LABELS, STAGE_LABELS } from '@/lib/utils';
import type { Entity } from '@/lib/supabase';

function getDomain(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function getLinkedInSlug(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/linkedin\.com\/company\/([^/?#]+)/);
  return m ? m[1] : null;
}

function getLogoUrl(entity: Entity): string | null {
  const domain = getDomain(entity.website);
  if (domain) return `https://img.logo.dev/${domain}?token=pk_RN8lKfQVS3iw41E9nWPWoA`;
  return null;
}

interface EntityCardProps {
  entity: Entity;
  compact?: boolean;
  className?: string;
}

const LOGO_BG: Record<string, string> = {
  startup: 'bg-blue-50 text-blue-600',
  investor: 'bg-green-50 text-green-700',
  accelerator: 'bg-amber-50 text-amber-700',
  service_provider: 'bg-slate-100 text-slate-600',
};

export function EntityLogo({ entity, size = 'md' }: { entity: Entity; size?: 'sm' | 'md' | 'lg' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };
  const cls = sizeClasses[size];
  const bg = LOGO_BG[entity.type] ?? 'bg-[var(--primary-light)] text-[var(--primary)]';

  const imgSrc = entity.logo_url ?? getLogoUrl(entity);

  if (imgSrc && !imgFailed) {
    return (
      <div className={cn('shrink-0 rounded-[var(--radius)] overflow-hidden border border-[var(--border)] bg-white', cls)}>
        <img
          src={imgSrc}
          alt={entity.name}
          className="w-full h-full object-contain p-0.5"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }
  return (
    <div className={cn('shrink-0 rounded-[var(--radius)] font-semibold flex items-center justify-center', bg, cls)}>
      {getInitials(entity.name)}
    </div>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const variantMap: Record<string, any> = {
    startup: 'startup',
    investor: 'investor',
    accelerator: 'accelerator',
    service_provider: 'service_provider',
  };
  return <Badge variant={variantMap[type] ?? 'default'}>{ENTITY_TYPE_LABELS[type] ?? type}</Badge>;
}

export function StageBadge({ stage }: { stage: string }) {
  const variantMap: Record<string, any> = {
    'pre-seed': 'seed',
    seed: 'seed',
    'series-a': 'series-a',
    'series-b': 'series-b',
    'series-c': 'series-c',
    growth: 'growth',
    bootstrapped: 'bootstrapped',
    acquired: 'acquired',
  };
  return <Badge variant={variantMap[stage] ?? 'default'}>{STAGE_LABELS[stage] ?? stage}</Badge>;
}

function StartupMeta({ entity, compact }: { entity: Entity; compact: boolean }) {
  const sd = entity.startup_details;
  return (
    <>
      {!compact && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5">
          {entity.city && (
            <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
              <MapPin size={11} />{entity.city}
            </span>
          )}
          {sd?.sector && (
            <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
              <Building2 size={11} />{sd.sector}
            </span>
          )}
          {sd?.employee_range && (
            <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
              <Users size={11} />{sd.employee_range}
            </span>
          )}
        </div>
      )}
      {!compact && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {sd?.stage && <StageBadge stage={sd.stage} />}
          {sd?.total_funding != null && sd.total_funding > 0 && (
            <Badge variant="default" className="flex items-center gap-0.5">
              <TrendingUp size={10} />{formatCurrency(sd.total_funding)}
            </Badge>
          )}
        </div>
      )}
      {compact && entity.city && (
        <p className="text-xs text-[var(--foreground-muted)] mt-1 flex items-center gap-1">
          <MapPin size={10} />{entity.city}
        </p>
      )}
    </>
  );
}

function InvestorMeta({ entity, compact }: { entity: Entity; compact: boolean }) {
  const id_ = entity.investor_details;
  return (
    <>
      {!compact && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5">
          {entity.city && (
            <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
              <MapPin size={11} />{entity.city}
            </span>
          )}
          {id_?.investor_type && (
            <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)] capitalize">
              <Briefcase size={11} />{id_.investor_type.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      )}
      {!compact && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {id_?.portfolio_count && (
            <Badge variant="default" className="flex items-center gap-0.5">
              <Target size={10} />{id_.portfolio_count} portfolio cos.
            </Badge>
          )}
          {id_?.ticket_min && id_?.ticket_max && (
            <Badge variant="default">
              {formatCurrency(id_.ticket_min)}–{formatCurrency(id_.ticket_max)}
            </Badge>
          )}
        </div>
      )}
      {id_?.focus_sectors && id_.focus_sectors.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {id_.focus_sectors.slice(0, 3).map(s => (
            <span key={s} className="text-[10px] text-[var(--foreground-muted)] bg-[var(--surface)] px-1.5 py-0.5 rounded">
              {s}
            </span>
          ))}
        </div>
      )}
      {compact && entity.city && (
        <p className="text-xs text-[var(--foreground-muted)] mt-1 flex items-center gap-1">
          <MapPin size={10} />{entity.city}
        </p>
      )}
    </>
  );
}

function AcceleratorMeta({ entity, compact }: { entity: Entity; compact: boolean }) {
  return (
    <>
      {!compact && entity.city && (
        <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)] mt-2.5">
          <MapPin size={11} />{entity.city}
        </div>
      )}
      {entity.founded_year && !compact && (
        <div className="mt-2">
          <Badge variant="default">Est. {entity.founded_year}</Badge>
        </div>
      )}
      {compact && entity.city && (
        <p className="text-xs text-[var(--foreground-muted)] mt-1 flex items-center gap-1">
          <MapPin size={10} />{entity.city}
        </p>
      )}
    </>
  );
}

export default function EntityCard({ entity, compact = false, className }: EntityCardProps) {
  return (
    <Link
      to={`/entity/${entity.slug || entity.id}`}
      className={cn(
        'group block bg-white border border-[var(--border)] rounded-[var(--radius-lg)] p-4 hover:border-[var(--border-strong)] hover:shadow-sm transition-all',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <EntityLogo entity={entity} size={compact ? 'sm' : 'md'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={cn('font-medium text-[var(--foreground)] truncate leading-tight', compact ? 'text-sm' : 'text-base')}>
                {entity.name}
              </h3>
              {entity.tagline && (
                <p className="text-xs text-[var(--foreground-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                  {entity.tagline}
                </p>
              )}
            </div>
            <TypeBadge type={entity.type} />
          </div>

          {entity.type === 'startup' && <StartupMeta entity={entity} compact={compact} />}
          {entity.type === 'investor' && <InvestorMeta entity={entity} compact={compact} />}
          {(entity.type === 'accelerator' || entity.type === 'service_provider') && (
            <AcceleratorMeta entity={entity} compact={compact} />
          )}
        </div>
      </div>
    </Link>
  );
}
