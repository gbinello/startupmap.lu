import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import {
  Globe, MapPin, Linkedin, Twitter, Calendar, Users, TrendingUp,
  Building2, ArrowLeft, ExternalLink, Mail, CheckCircle, AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import EntityCard from '../components/EntityCard';
import { supabase } from '@/lib/supabase';
import type { Entity, FundingRound, TeamMember } from '@/lib/supabase';
import { ENTITY_TYPE_LABELS, STAGE_LABELS, formatCurrency, formatDate, getInitials } from '@/lib/utils';

export default function EntityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [rounds, setRounds] = useState<FundingRound[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [portfolio, setPortfolio] = useState<Entity[]>([]);
  const [investors, setInvestors] = useState<Entity[]>([]);
  const [related, setRelated] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) loadEntity(slug);
  }, [slug]);

  async function loadEntity(s: string) {
    setLoading(true);
    const { data } = await supabase
      .from('entities')
      .select('*, startup_details(*), investor_details(*)')
      .or(`slug.eq.${s},id.eq.${s}`)
      .eq('visible', true)
      .single();

    if (data) {
      setEntity(data as Entity);

      const queries: Promise<any>[] = [
        supabase
          .from('funding_rounds')
          .select('*, round_investors(lead, investor:investor_id(id, name, slug, logo_url))')
          .eq('startup_id', data.id)
          .order('date', { ascending: false }),
        supabase
          .from('team_members')
          .select('*')
          .eq('entity_id', data.id),
        supabase
          .from('entities')
          .select('*, startup_details(*), investor_details(*)')
          .eq('type', data.type)
          .eq('visible', true)
          .neq('id', data.id)
          .limit(3),
      ];

      const [{ data: roundData }, { data: teamData }, { data: relatedData }] = await Promise.all(queries);

      setRounds((roundData as any[]) || []);
      setTeam((teamData as TeamMember[]) || []);
      setRelated((relatedData as Entity[]) || []);

      // Load investors for startup pages
      if (data.type === 'startup') {
        const { data: riData } = await supabase
          .from('round_investors')
          .select('investor_id')
          .eq('startup_id', data.id);

        if (riData && riData.length > 0) {
          const investorIds = [...new Set((riData as any[]).map((r: any) => r.investor_id))];
          const { data: investorsData } = await supabase
            .from('entities')
            .select('*, investor_details(*)')
            .in('id', investorIds)
            .eq('visible', true);
          setInvestors((investorsData as Entity[]) || []);
        }
      }

      // Load investor portfolio via round_investors
      if (data.type === 'investor') {
        const { data: riData } = await supabase
          .from('round_investors')
          .select('startup_id')
          .eq('investor_id', data.id);

        if (riData && riData.length > 0) {
          const startupIds = [...new Set((riData as any[]).map((r: any) => r.startup_id))];
          const { data: portfolioData } = await supabase
            .from('entities')
            .select('*, startup_details(*)')
            .in('id', startupIds)
            .eq('visible', true);
          setPortfolio((portfolioData as Entity[]) || []);
        }
      }
    }
    setLoading(false);
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="h-4 w-24 bg-[var(--surface)] rounded animate-pulse mb-8" />
      <div className="h-12 w-64 bg-[var(--surface)] rounded animate-pulse mb-4" />
      <div className="h-4 w-96 bg-[var(--surface)] rounded animate-pulse" />
    </div>
  );

  if (!entity) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <p className="text-[var(--foreground-secondary)] mb-4">Entity not found</p>
      <Button variant="outline" asChild>
        <Link to="/directory"><ArrowLeft size={14} /> Back to directory</Link>
      </Button>
    </div>
  );

  const sd = entity.startup_details;
  const id_ = entity.investor_details;
  const totalFunding = rounds.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <>
      <Helmet>
        <title>{entity.name} — startupmap.lu</title>
        <meta name="description" content={entity.tagline || `${entity.name} on startupmap.lu`} />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/directory"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Directory
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header card */}
            <div className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
              <div className="flex items-start gap-4">
                {entity.logo_url ? (
                  <img src={entity.logo_url} alt={entity.name} className="w-16 h-16 rounded-[var(--radius-lg)] border border-[var(--border)] object-contain p-1 bg-white" />
                ) : (
                  <div className="w-16 h-16 rounded-[var(--radius-lg)] bg-[var(--primary-light)] text-[var(--primary)] font-semibold text-xl flex items-center justify-center shrink-0">
                    {getInitials(entity.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h1 className="text-xl font-semibold text-[var(--foreground)]">{entity.name}</h1>
                    {entity.claimed && (
                      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle size={11} /> Verified
                      </span>
                    )}
                  </div>
                  {entity.tagline && (
                    <p className="text-sm text-[var(--foreground-secondary)] mt-1 leading-relaxed">{entity.tagline}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <Badge variant={entity.type as any}>{ENTITY_TYPE_LABELS[entity.type]}</Badge>
                    {sd?.stage && <Badge variant={sd.stage as any}>{STAGE_LABELS[sd.stage] ?? sd.stage}</Badge>}
                    {sd?.sector && <Badge variant="default">{sd.sector}</Badge>}
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-[var(--border)]">
                {entity.website && (
                  <a href={entity.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors">
                    <Globe size={13} /> Website <ExternalLink size={10} className="opacity-50" />
                  </a>
                )}
                {entity.linkedin_url && (
                  <a href={entity.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors">
                    <Linkedin size={13} /> LinkedIn
                  </a>
                )}
                {entity.twitter_url && (
                  <a href={entity.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors">
                    <Twitter size={13} /> Twitter
                  </a>
                )}
                {entity.email && (
                  <a href={`mailto:${entity.email}`} className="flex items-center gap-1.5 text-xs text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors">
                    <Mail size={13} /> Email
                  </a>
                )}
              </div>
            </div>

            {/* About */}
            {entity.description && (
              <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">About</h2>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-line">{entity.description}</p>
              </section>
            )}

            {/* Team */}
            {team.length > 0 && (
              <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Team</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {team.map(member => (
                    <TeamMemberCard key={member.id} member={member} />
                  ))}
                </div>
              </section>
            )}

            {/* Funding rounds */}
            {rounds.length > 0 && (
              <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">Funding</h2>
                  {totalFunding > 0 && (
                    <span className="text-sm font-semibold text-[var(--primary)]">{formatCurrency(totalFunding)} raised</span>
                  )}
                </div>
                <div className="space-y-3">
                  {rounds.map(round => (
                    <div key={round.id} className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                      <div className="w-8 h-8 rounded-[var(--radius)] bg-white border border-[var(--border)] flex items-center justify-center shrink-0">
                        <TrendingUp size={14} className="text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {round.round_type}
                          {round.amount ? ` · ${formatCurrency(round.amount, round.currency)}` : ''}
                        </p>
                        {round.date && (
                          <p className="text-xs text-[var(--foreground-muted)]">{formatDate(round.date)}</p>
                        )}
                      </div>
                      {round.round_investors && round.round_investors.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          {round.round_investors.slice(0, 3).map((ri: any) => (
                            <Link
                              key={ri.investor?.id}
                              to={`/entity/${ri.investor?.slug || ri.investor?.id}`}
                              className="text-xs text-[var(--foreground-secondary)] hover:text-[var(--primary)] truncate max-w-24"
                            >
                              {ri.investor?.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Investors (startups only) */}
            {investors.length > 0 && (
              <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Investors</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {investors.map(e => <EntityCard key={e.id} entity={e} compact />)}
                </div>
              </section>
            )}

            {/* Investor profile */}
            {id_ && (
              <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Investment profile</h2>
                <div className="grid grid-cols-2 gap-4">
                  {id_.investor_type && (
                    <Stat label="Type" value={id_.investor_type.replace('_', ' ')} />
                  )}
                  {id_.portfolio_count && (
                    <Stat label="Portfolio companies" value={String(id_.portfolio_count)} />
                  )}
                  {id_.ticket_min && id_.ticket_max && (
                    <Stat
                      label="Ticket size"
                      value={`${formatCurrency(id_.ticket_min)} – ${formatCurrency(id_.ticket_max)}`}
                    />
                  )}
                  {id_.stage_focus && id_.stage_focus.length > 0 && (
                    <div>
                      <p className="text-xs text-[var(--foreground-muted)] mb-1.5">Stage focus</p>
                      <div className="flex flex-wrap gap-1">
                        {id_.stage_focus.map(s => (
                          <Badge key={s} variant="outline">{STAGE_LABELS[s] ?? s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {id_.focus_sectors && id_.focus_sectors.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs text-[var(--foreground-muted)] mb-1.5">Focus sectors</p>
                      <div className="flex flex-wrap gap-1">
                        {id_.focus_sectors.map(s => (
                          <Badge key={s} variant="default">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Portfolio companies (investors only) */}
            {portfolio.length > 0 && (
              <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Portfolio companies</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {portfolio.map(e => <EntityCard key={e.id} entity={e} compact />)}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Key details */}
            <div className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-4">
              <h3 className="text-xs font-semibold text-[var(--foreground)] mb-3 uppercase tracking-wide">Details</h3>
              <div className="space-y-2.5">
                {entity.city && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={13} className="text-[var(--foreground-muted)] shrink-0" />
                    <span className="text-[var(--foreground-secondary)]">{entity.city}</span>
                  </div>
                )}
                {entity.founded_year && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={13} className="text-[var(--foreground-muted)] shrink-0" />
                    <span className="text-[var(--foreground-secondary)]">Founded {entity.founded_year}</span>
                  </div>
                )}
                {sd?.employee_range && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={13} className="text-[var(--foreground-muted)] shrink-0" />
                    <span className="text-[var(--foreground-secondary)]">{sd.employee_range} employees</span>
                  </div>
                )}
                {sd?.sector && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 size={13} className="text-[var(--foreground-muted)] shrink-0" />
                    <span className="text-[var(--foreground-secondary)]">{sd.sector}</span>
                  </div>
                )}
                {entity.hq_address && (
                  <p className="text-xs text-[var(--foreground-muted)] pl-5 leading-relaxed">{entity.hq_address}</p>
                )}
              </div>
            </div>

            {/* Contact */}
            {(entity.website || entity.email || entity.linkedin_url) && (
              <div className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-4">
                <h3 className="text-xs font-semibold text-[var(--foreground)] mb-3 uppercase tracking-wide">Contact</h3>
                <div className="space-y-2">
                  {entity.email && (
                    <a
                      href={`mailto:${entity.email}`}
                      className="flex items-center gap-2.5 text-sm text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors group"
                    >
                      <span className="w-7 h-7 rounded-[var(--radius)] bg-[var(--surface)] flex items-center justify-center shrink-0 group-hover:bg-[var(--primary-light)] transition-colors">
                        <Mail size={13} />
                      </span>
                      <span className="truncate">{entity.email}</span>
                    </a>
                  )}
                  {entity.website && (
                    <a
                      href={entity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors group"
                    >
                      <span className="w-7 h-7 rounded-[var(--radius)] bg-[var(--surface)] flex items-center justify-center shrink-0 group-hover:bg-[var(--primary-light)] transition-colors">
                        <Globe size={13} />
                      </span>
                      <span className="truncate">{entity.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  {entity.linkedin_url && (
                    <a
                      href={entity.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors group"
                    >
                      <span className="w-7 h-7 rounded-[var(--radius)] bg-[var(--surface)] flex items-center justify-center shrink-0 group-hover:bg-[var(--primary-light)] transition-colors">
                        <Linkedin size={13} />
                      </span>
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {entity.twitter_url && (
                    <a
                      href={entity.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors group"
                    >
                      <span className="w-7 h-7 rounded-[var(--radius)] bg-[var(--surface)] flex items-center justify-center shrink-0 group-hover:bg-[var(--primary-light)] transition-colors">
                        <Twitter size={13} />
                      </span>
                      <span>Twitter / X</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Claim CTA */}
            {!entity.claimed && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle size={14} className="text-[var(--foreground-muted)] shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
                    Is this your company? Claim this profile to update it and manage your presence.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link to={`/claim/${entity.id}`}>Claim profile</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">
              More {ENTITY_TYPE_LABELS[entity.type]}s
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {related.map(e => <EntityCard key={e.id} entity={e} compact />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--foreground-muted)]">{label}</p>
      <p className="text-sm font-medium text-[var(--foreground)] mt-0.5 capitalize">{value}</p>
    </div>
  );
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
      <div className="w-9 h-9 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-semibold flex items-center justify-center shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{member.name}</p>
        <p className="text-xs text-[var(--foreground-muted)] truncate">{member.role}</p>
      </div>
      {member.linkedin_url && (
        <a
          href={member.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors shrink-0"
          title="LinkedIn"
        >
          <Linkedin size={13} />
        </a>
      )}
    </div>
  );
}
