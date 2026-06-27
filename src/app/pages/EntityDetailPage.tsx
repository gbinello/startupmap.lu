import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import {
  Globe, MapPin, Linkedin, Twitter, Calendar, Users, TrendingUp,
  Building2, ArrowLeft, ExternalLink, Mail, CheckCircle, AlertCircle,
  Bookmark, BookmarkCheck, Pencil, X, Save, Plus, Trash2, Upload,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import EntityCard from '../components/EntityCard';
import { supabase } from '@/lib/supabase';
import type { Entity, FundingRound, TeamMember } from '@/lib/supabase';
import { ENTITY_TYPE_LABELS, STAGE_LABELS, SECTORS, LU_CITIES, formatCurrency, formatDate, getInitials } from '@/lib/utils';

const EMPLOYEE_RANGES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
const INVESTOR_TYPES = ['vc', 'angel', 'family_office', 'corporate', 'accelerator', 'government'];

export default function EntityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [rounds, setRounds] = useState<FundingRound[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [portfolio, setPortfolio] = useState<Entity[]>([]);
  const [investors, setInvestors] = useState<Entity[]>([]);
  const [related, setRelated] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEntityId, setUserEntityId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (slug) loadEntity(slug);
  }, [slug]);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);
    const { data: profile } = await supabase.from('profiles').select('entity_id').eq('id', user.id).single();
    if (profile?.entity_id) setUserEntityId(profile.entity_id);
    // Check shortlist
    const { data: saved_rows } = await supabase.from('saved_entities').select('entity_id').eq('user_id', user.id);
    if (saved_rows) {
      const ids = (saved_rows as any[]).map((r: any) => r.entity_id);
      // Will set after entity loads
      if (slug) {
        // We'll reconcile in loadEntity
      }
    }
  }

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

      // Check if this entity is in shortlist
      if (currentUserId) {
        const { data: savedRows } = await supabase.from('saved_entities').select('entity_id').eq('user_id', currentUserId);
        if (savedRows) {
          const ids = (savedRows as any[]).map((r: any) => r.entity_id);
          setSaved(ids.includes(data.id));
        }
      }

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

      if (data.type === 'startup') {
        const { data: riData } = await supabase.from('round_investors').select('investor_id').eq('startup_id', data.id);
        if (riData && riData.length > 0) {
          const investorIds = [...new Set((riData as any[]).map((r: any) => r.investor_id))];
          const { data: investorsData } = await supabase.from('entities').select('*, investor_details(*)').in('id', investorIds).eq('visible', true);
          setInvestors((investorsData as Entity[]) || []);
        }
      }

      if (data.type === 'investor') {
        const { data: riData } = await supabase.from('round_investors').select('startup_id').eq('investor_id', data.id);
        if (riData && riData.length > 0) {
          const startupIds = [...new Set((riData as any[]).map((r: any) => r.startup_id))];
          const { data: portfolioData } = await supabase.from('entities').select('*, startup_details(*)').in('id', startupIds).eq('visible', true);
          setPortfolio((portfolioData as Entity[]) || []);
        }
      }
    }
    setLoading(false);
  }

  async function toggleSave() {
    if (!entity || !currentUserId) return;
    if (saved) {
      await supabase.from('saved_entities').delete().eq('user_id', currentUserId).eq('entity_id', entity.id);
      setSaved(false);
    } else {
      await supabase.from('saved_entities').insert({ user_id: currentUserId, entity_id: entity.id });
      setSaved(true);
    }
  }

  function handleEditSave(updated: Entity, updatedRounds: FundingRound[], updatedTeam: TeamMember[]) {
    setEntity(updated);
    setRounds(updatedRounds);
    setTeam(updatedTeam);
    setEditOpen(false);
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
  const isOwner = !!userEntityId && userEntityId === entity.id;

  return (
    <>
      <Helmet>
        <title>{entity.name} — {ENTITY_TYPE_LABELS[entity.type]} in Luxembourg | startupmap.lu</title>
        <meta name="description" content={[entity.name, entity.city ? `based in ${entity.city}` : 'Luxembourg', entity.tagline || entity.description?.slice(0, 120)].filter(Boolean).join(' — ')} />
        <link rel="canonical" href={`https://startupmap.lu/entity/${entity.slug || entity.id}`} />
        <meta property="og:title" content={`${entity.name} | startupmap.lu`} />
        <meta property="og:description" content={entity.tagline || entity.description?.slice(0, 160) || `${entity.name} on startupmap.lu`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://startupmap.lu/entity/${entity.slug || entity.id}`} />
        <meta property="og:site_name" content="startupmap.lu" />
        {entity.logo_url && <meta property="og:image" content={entity.logo_url} />}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${entity.name} | startupmap.lu`} />
        <meta name="twitter:description" content={entity.tagline || `${entity.name} on startupmap.lu`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Organization',
          name: entity.name, description: entity.tagline || entity.description,
          url: entity.website, logo: entity.logo_url, foundingDate: entity.founded_year?.toString(),
          address: { '@type': 'PostalAddress', addressLocality: entity.city || 'Luxembourg', addressCountry: 'LU' },
          sameAs: [entity.linkedin_url, entity.twitter_url].filter(Boolean),
        })}</script>
      </Helmet>

      {/* Edit panel */}
      {editOpen && entity && (
        <EditPanel entity={entity} rounds={rounds} team={team} onSave={handleEditSave} onClose={() => setEditOpen(false)} />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/directory" className="inline-flex items-center gap-1.5 text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
            <ArrowLeft size={14} /> Directory
          </Link>
          <div className="flex items-center gap-2">
            {currentUserId && (
              <button
                onClick={toggleSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius)] border transition-colors ${
                  saved
                    ? 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary-light)]'
                    : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:bg-[var(--surface)]'
                }`}
              >
                {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {saved ? 'Saved' : 'Save'}
              </button>
            )}
            {isOwner && (
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5">
                <Pencil size={12} /> Edit listing
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
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
                  {entity.tagline && <p className="text-sm text-[var(--foreground-secondary)] mt-1 leading-relaxed">{entity.tagline}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <Badge variant={entity.type as any}>{ENTITY_TYPE_LABELS[entity.type]}</Badge>
                    {sd?.stage && <Badge variant={sd.stage as any}>{STAGE_LABELS[sd.stage] ?? sd.stage}</Badge>}
                    {sd?.sector && <Badge variant="default">{sd.sector}</Badge>}
                  </div>
                </div>
              </div>

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

            {entity.description && (
              <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">About</h2>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-line">{entity.description}</p>
              </section>
            )}

            {team.length > 0 && (
              <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Team</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {team.map(member => <TeamMemberCard key={member.id} member={member} />)}
                </div>
              </section>
            )}

            {rounds.length > 0 && (
              <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">Funding</h2>
                  {totalFunding > 0 && <span className="text-sm font-semibold text-[var(--primary)]">{formatCurrency(totalFunding)} raised</span>}
                </div>
                <div className="space-y-3">
                  {rounds.map(round => (
                    <div key={round.id} className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                      <div className="w-8 h-8 rounded-[var(--radius)] bg-white border border-[var(--border)] flex items-center justify-center shrink-0">
                        <TrendingUp size={14} className="text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {round.round_type}{round.amount ? ` · ${formatCurrency(round.amount, round.currency)}` : ''}
                        </p>
                        {round.date && <p className="text-xs text-[var(--foreground-muted)]">{formatDate(round.date)}</p>}
                      </div>
                      {round.round_investors && round.round_investors.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          {round.round_investors.slice(0, 3).map((ri: any) => (
                            <Link key={ri.investor?.id} to={`/entity/${ri.investor?.slug || ri.investor?.id}`} className="text-xs text-[var(--foreground-secondary)] hover:text-[var(--primary)] truncate max-w-24">
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

            {investors.length > 0 && (
              <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Investors</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {investors.map(e => <EntityCard key={e.id} entity={e} compact />)}
                </div>
              </section>
            )}

            {id_ && (
              <section className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Investment profile</h2>
                <div className="grid grid-cols-2 gap-4">
                  {id_.investor_type && <Stat label="Type" value={id_.investor_type.replace('_', ' ')} />}
                  {id_.portfolio_count && <Stat label="Portfolio companies" value={String(id_.portfolio_count)} />}
                  {id_.ticket_min && id_.ticket_max && <Stat label="Ticket size" value={`${formatCurrency(id_.ticket_min)} – ${formatCurrency(id_.ticket_max)}`} />}
                  {id_.stage_focus && id_.stage_focus.length > 0 && (
                    <div>
                      <p className="text-xs text-[var(--foreground-muted)] mb-1.5">Stage focus</p>
                      <div className="flex flex-wrap gap-1">
                        {id_.stage_focus.map((s: string) => <Badge key={s} variant="outline">{STAGE_LABELS[s] ?? s}</Badge>)}
                      </div>
                    </div>
                  )}
                  {id_.focus_sectors && id_.focus_sectors.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs text-[var(--foreground-muted)] mb-1.5">Focus sectors</p>
                      <div className="flex flex-wrap gap-1">
                        {id_.focus_sectors.map((s: string) => <Badge key={s} variant="default">{s}</Badge>)}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

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
                {entity.hq_address && <p className="text-xs text-[var(--foreground-muted)] pl-5 leading-relaxed">{entity.hq_address}</p>}
              </div>
            </div>

            {(entity.website || entity.email || entity.linkedin_url) && (
              <div className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-4">
                <h3 className="text-xs font-semibold text-[var(--foreground)] mb-3 uppercase tracking-wide">Contact</h3>
                <div className="space-y-2">
                  {entity.email && (
                    <a href={`mailto:${entity.email}`} className="flex items-center gap-2.5 text-sm text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors group">
                      <span className="w-7 h-7 rounded-[var(--radius)] bg-[var(--surface)] flex items-center justify-center shrink-0 group-hover:bg-[var(--primary-light)] transition-colors"><Mail size={13} /></span>
                      <span className="truncate">{entity.email}</span>
                    </a>
                  )}
                  {entity.website && (
                    <a href={entity.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors group">
                      <span className="w-7 h-7 rounded-[var(--radius)] bg-[var(--surface)] flex items-center justify-center shrink-0 group-hover:bg-[var(--primary-light)] transition-colors"><Globe size={13} /></span>
                      <span className="truncate">{entity.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  {entity.linkedin_url && (
                    <a href={entity.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors group">
                      <span className="w-7 h-7 rounded-[var(--radius)] bg-[var(--surface)] flex items-center justify-center shrink-0 group-hover:bg-[var(--primary-light)] transition-colors"><Linkedin size={13} /></span>
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {entity.twitter_url && (
                    <a href={entity.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors group">
                      <span className="w-7 h-7 rounded-[var(--radius)] bg-[var(--surface)] flex items-center justify-center shrink-0 group-hover:bg-[var(--primary-light)] transition-colors"><Twitter size={13} /></span>
                      <span>Twitter / X</span>
                    </a>
                  )}
                </div>
              </div>
            )}

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

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">More {ENTITY_TYPE_LABELS[entity.type]}s</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {related.map(e => <EntityCard key={e.id} entity={e} compact />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Edit panel ────────────────────────────────────────────────────────────────

interface TeamMemberDraft {
  id: string;
  name: string;
  role: string;
  linkedin_url: string;
  _new?: boolean;
  _delete?: boolean;
}

interface RoundInvestorDraft {
  id: string;
  investor_id: string;    // '' for unlinked
  name: string;
  lead: boolean;
  unlinked?: boolean;     // true = free-text entry, no entity link
  _new?: boolean;
  _delete?: boolean;
}

interface RoundDraft {
  id: string;
  round_type: string;
  amount: string;
  currency: string;
  date: string;
  _new?: boolean;
  _delete?: boolean;
  investors: RoundInvestorDraft[];
}

const ROUND_TYPES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Bridge', 'Grant', 'Convertible'];
const SELECT_CLS = 'w-full text-sm px-3 py-2 border border-[var(--border)] rounded-[var(--radius)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]';

function EditPanel({
  entity, rounds, team, onSave, onClose,
}: {
  entity: Entity;
  rounds: FundingRound[];
  team: TeamMember[];
  onSave: (e: Entity, rounds: FundingRound[], team: TeamMember[]) => void;
  onClose: () => void;
}) {
  const sd = entity.startup_details;
  const id_ = entity.investor_details;

  const [form, setForm] = useState({
    name: entity.name,
    tagline: entity.tagline ?? '',
    description: entity.description ?? '',
    website: entity.website ?? '',
    city: entity.city ?? '',
    founded_year: entity.founded_year ? String(entity.founded_year) : '',
    email: entity.email ?? '',
    linkedin_url: entity.linkedin_url ?? '',
    twitter_url: entity.twitter_url ?? '',
    logo_url: entity.logo_url ?? '',
  });

  const [startupForm, setStartupForm] = useState({
    sector: sd?.sector ?? '',
    stage: sd?.stage ?? '',
    employee_range: sd?.employee_range ?? '',
    b2b: sd?.b2b ?? false,
    b2c: sd?.b2c ?? false,
  });

  const [investorForm, setInvestorForm] = useState({
    investor_type: id_?.investor_type ?? '',
    ticket_min: id_?.ticket_min ? String(id_.ticket_min) : '',
    ticket_max: id_?.ticket_max ? String(id_.ticket_max) : '',
    portfolio_count: id_?.portfolio_count ? String(id_.portfolio_count) : '',
  });

  const [roundDrafts, setRoundDrafts] = useState<RoundDraft[]>([]);
  const [allInvestors, setAllInvestors] = useState<Entity[]>([]);
  const [freeTextNames, setFreeTextNames] = useState<Record<string, string>>({});
  const [teamDrafts, setTeamDrafts] = useState<TeamMemberDraft[]>(
    team.map(m => ({ id: m.id, name: m.name, role: m.role, linkedin_url: m.linkedin_url ?? '' }))
  );
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result) setForm(prev => ({ ...prev, logo_url: ev.target!.result as string }));
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (entity.type !== 'startup') return;
    async function loadRoundData() {
      const [{ data: riData }, { data: invData }] = await Promise.all([
        supabase.from('round_investors').select('*').eq('startup_id', entity.id),
        supabase.from('entities').select('id, name, slug').eq('type', 'investor').eq('visible', true),
      ]);
      const ris = (riData as any[]) ?? [];
      const invs = (invData as Entity[]) ?? [];
      setAllInvestors(invs);
      const invMap = new Map(invs.map(e => [e.id, e.name]));
      setRoundDrafts(rounds.map(r => ({
        id: r.id,
        round_type: r.round_type,
        amount: r.amount ? String(r.amount) : '',
        currency: r.currency ?? 'EUR',
        date: r.date ?? '',
        investors: ris
          .filter(ri => ri.round_id === r.id)
          .map(ri => ({
            id: ri.id,
            investor_id: ri.investor_id,
            name: invMap.get(ri.investor_id) ?? 'Unknown',
            lead: ri.lead ?? false,
          })),
      })));
    }
    loadRoundData();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const entityUpdate = {
      ...form,
      founded_year: form.founded_year ? parseInt(form.founded_year) : undefined,
    };
    await supabase.from('entities').update(entityUpdate).eq('id', entity.id);

    if (entity.type === 'startup') {
      await supabase.from('startup_details').update(startupForm).eq('entity_id', entity.id);
    }
    if (entity.type === 'investor') {
      await supabase.from('investor_details').update({
        ...investorForm,
        ticket_min: investorForm.ticket_min ? parseInt(investorForm.ticket_min) : null,
        ticket_max: investorForm.ticket_max ? parseInt(investorForm.ticket_max) : null,
        portfolio_count: investorForm.portfolio_count ? parseInt(investorForm.portfolio_count) : null,
      }).eq('entity_id', entity.id);
    }

    // Save round changes
    const savedRoundIds: { draft: RoundDraft; savedId: string }[] = [];
    for (const r of roundDrafts) {
      if (r._delete && !r._new) {
        await supabase.from('round_investors').delete().eq('round_id', r.id);
        await supabase.from('funding_rounds').delete().eq('id', r.id);
      } else if (r._new && !r._delete) {
        const { data: newRound } = await supabase.from('funding_rounds').insert({
          startup_id: entity.id,
          round_type: r.round_type,
          amount: r.amount ? parseFloat(r.amount) : null,
          currency: r.currency || 'EUR',
          date: r.date || null,
          announced: true,
        });
        const savedId = (newRound as any)?.id ?? r.id;
        savedRoundIds.push({ draft: r, savedId });
        for (const inv of r.investors.filter(i => !i._delete)) {
          await supabase.from('round_investors').insert({
            round_id: savedId,
            ...(inv.unlinked ? { investor_name: inv.name } : { investor_id: inv.investor_id }),
            startup_id: entity.id, lead: inv.lead,
          });
        }
      } else if (!r._new && !r._delete) {
        await supabase.from('funding_rounds').update({
          round_type: r.round_type,
          amount: r.amount ? parseFloat(r.amount) : null,
          currency: r.currency || 'EUR',
          date: r.date || null,
        }).eq('id', r.id);
        for (const inv of r.investors) {
          if (inv._delete && !inv._new) {
            await supabase.from('round_investors').delete().eq('id', inv.id);
          } else if (inv._new && !inv._delete) {
            await supabase.from('round_investors').insert({
              round_id: r.id,
              ...(inv.unlinked ? { investor_name: inv.name } : { investor_id: inv.investor_id }),
              startup_id: entity.id, lead: inv.lead,
            });
          }
        }
        savedRoundIds.push({ draft: r, savedId: r.id });
      }
    }

    const updatedRounds: FundingRound[] = roundDrafts
      .filter(r => !r._delete)
      .map(r => {
        const savedId = savedRoundIds.find(s => s.draft === r)?.savedId ?? r.id;
        return {
          id: savedId,
          startup_id: entity.id,
          round_type: r.round_type,
          amount: r.amount ? parseFloat(r.amount) : undefined,
          currency: r.currency || 'EUR',
          date: r.date || undefined,
          announced: true,
        };
      });

    const updated: Entity = {
      ...entity, ...entityUpdate,
      startup_details: entity.startup_details ? { ...entity.startup_details, ...startupForm } : entity.startup_details,
      investor_details: entity.investor_details ? {
        ...entity.investor_details, ...investorForm,
        ticket_min: investorForm.ticket_min ? parseInt(investorForm.ticket_min) : undefined,
        ticket_max: investorForm.ticket_max ? parseInt(investorForm.ticket_max) : undefined,
        portfolio_count: investorForm.portfolio_count ? parseInt(investorForm.portfolio_count) : undefined,
      } : entity.investor_details,
    };

    // Save team changes
    const savedTeam: TeamMember[] = [];
    for (const m of teamDrafts) {
      if (m._delete && !m._new) {
        await supabase.from('team_members').delete().eq('id', m.id);
      } else if (m._new && !m._delete) {
        const { data: newMember } = await supabase.from('team_members').insert({
          entity_id: entity.id, name: m.name, role: m.role, linkedin_url: m.linkedin_url || null,
        });
        if (newMember) savedTeam.push({ ...(newMember as any) });
        else savedTeam.push({ id: m.id, entity_id: entity.id, name: m.name, role: m.role, linkedin_url: m.linkedin_url || undefined });
      } else if (!m._new && !m._delete) {
        await supabase.from('team_members').update({ name: m.name, role: m.role, linkedin_url: m.linkedin_url || null }).eq('id', m.id);
        savedTeam.push({ id: m.id, entity_id: entity.id, name: m.name, role: m.role, linkedin_url: m.linkedin_url || undefined });
      }
    }

    setSaving(false);
    onSave(updated, updatedRounds, savedTeam);
  }

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));
  const sf = (key: keyof typeof startupForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setStartupForm(prev => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  const inf = (key: keyof typeof investorForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setInvestorForm(prev => ({ ...prev, [key]: e.target.value }));

  function updateRound(idx: number, patch: Partial<RoundDraft>) {
    setRoundDrafts(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }
  function addRound() {
    setRoundDrafts(prev => [...prev, {
      id: `new-${Date.now()}`,
      round_type: 'Seed',
      amount: '', currency: 'EUR', date: '',
      _new: true, investors: [],
    }]);
  }
  function addInvestorToRound(roundIdx: number, investorId: string) {
    const inv = allInvestors.find(e => e.id === investorId);
    if (!inv) return;
    setRoundDrafts(prev => prev.map((r, i) => {
      if (i !== roundIdx) return r;
      if (r.investors.some(ri => ri.investor_id === investorId && !ri._delete)) return r;
      return {
        ...r, investors: [...r.investors, {
          id: `new-${Date.now()}`, investor_id: inv.id,
          name: inv.name, lead: false, _new: true,
        }],
      };
    }));
  }

  function addUnlinkedInvestor(roundId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setRoundDrafts(prev => prev.map(r => {
      if (r.id !== roundId) return r;
      if (r.investors.some(i => i.name.toLowerCase() === trimmed.toLowerCase() && !i._delete)) return r;
      return {
        ...r, investors: [...r.investors, {
          id: `new-${Date.now()}`, investor_id: '',
          name: trimmed, lead: false, _new: true, unlinked: true,
        }],
      };
    }));
    setFreeTextNames(prev => ({ ...prev, [roundId]: '' }));
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 w-full max-w-lg bg-white border-l border-[var(--border)] z-50 flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Edit listing</h2>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded hover:bg-[var(--surface)] text-[var(--foreground-muted)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Logo */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide mb-3">Logo</legend>
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <img src={form.logo_url} alt="" className="w-14 h-14 rounded-[var(--radius-lg)] border border-[var(--border)] object-contain p-1 bg-white shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-14 h-14 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0 text-[var(--foreground-muted)] text-xs">No logo</div>
              )}
              <div className="flex-1 space-y-2">
                <Input value={form.logo_url} onChange={f('logo_url')} placeholder="https://… (image URL)" />
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline">
                    <Upload size={12} /> Upload image
                  </button>
                  <span className="text-xs text-[var(--foreground-muted)]">or paste a URL above</span>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>
          </fieldset>

          {/* Core info */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide mb-3">Basic info</legend>
            <Field label="Name"><Input value={form.name} onChange={f('name')} required /></Field>
            <Field label="Tagline"><Input value={form.tagline} onChange={f('tagline')} placeholder="One-line description" /></Field>
            <Field label="Description">
              <textarea value={form.description} onChange={f('description')} rows={4}
                className="w-full text-sm px-3 py-2 border border-[var(--border)] rounded-[var(--radius)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                placeholder="About your company…" />
            </Field>
          </fieldset>

          {/* Links */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide mb-3">Links</legend>
            <Field label="Website"><Input value={form.website} onChange={f('website')} placeholder="https://" /></Field>
            <Field label="LinkedIn"><Input value={form.linkedin_url} onChange={f('linkedin_url')} placeholder="https://linkedin.com/company/…" /></Field>
            <Field label="Twitter / X"><Input value={form.twitter_url} onChange={f('twitter_url')} placeholder="https://x.com/…" /></Field>
            <Field label="Email"><Input value={form.email} onChange={f('email')} type="email" /></Field>
          </fieldset>

          {/* Location */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide mb-3">Location & founding</legend>
            <Field label="City">
              <select value={form.city} onChange={f('city')} className={SELECT_CLS}>
                <option value="">Select city</option>
                {LU_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Founded year"><Input value={form.founded_year} onChange={f('founded_year')} type="number" placeholder="2020" min="1900" max="2030" /></Field>
          </fieldset>

          {/* Startup-specific */}
          {entity.type === 'startup' && (
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide mb-3">Startup details</legend>
              <Field label="Sector">
                <select value={startupForm.sector} onChange={sf('sector')} className={SELECT_CLS}>
                  <option value="">Select sector</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Stage">
                <select value={startupForm.stage} onChange={sf('stage')} className={SELECT_CLS}>
                  <option value="">Select stage</option>
                  {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Team size">
                <select value={startupForm.employee_range} onChange={sf('employee_range')} className={SELECT_CLS}>
                  <option value="">Select range</option>
                  {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] cursor-pointer">
                  <input type="checkbox" checked={startupForm.b2b} onChange={sf('b2b')} className="rounded" /> B2B
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] cursor-pointer">
                  <input type="checkbox" checked={startupForm.b2c} onChange={sf('b2c')} className="rounded" /> B2C
                </label>
              </div>
            </fieldset>
          )}

          {/* Investor-specific */}
          {entity.type === 'investor' && (
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide mb-3">Investor details</legend>
              <Field label="Investor type">
                <select value={investorForm.investor_type} onChange={inf('investor_type')} className={SELECT_CLS}>
                  <option value="">Select type</option>
                  {INVESTOR_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Min ticket (€)"><Input value={investorForm.ticket_min} onChange={inf('ticket_min')} type="number" placeholder="50000" /></Field>
                <Field label="Max ticket (€)"><Input value={investorForm.ticket_max} onChange={inf('ticket_max')} type="number" placeholder="500000" /></Field>
              </div>
              <Field label="Portfolio companies"><Input value={investorForm.portfolio_count} onChange={inf('portfolio_count')} type="number" placeholder="12" /></Field>
            </fieldset>
          )}

          {/* Funding rounds */}
          {entity.type === 'startup' && (
            <fieldset>
              <div className="flex items-center justify-between mb-3">
                <legend className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">Funding rounds</legend>
                <button type="button" onClick={addRound}
                  className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
                  <Plus size={12} /> Add round
                </button>
              </div>
              <div className="space-y-3">
                {roundDrafts.filter(r => !r._delete).map((r, idx) => {
                  const realIdx = roundDrafts.indexOf(r);
                  const activeInvestors = r.investors.filter(i => !i._delete);
                  const unusedInvestors = allInvestors.filter(e => !activeInvestors.some(i => i.investor_id === e.id));
                  return (
                    <div key={r.id} className="border border-[var(--border)] rounded-[var(--radius-lg)] p-3 space-y-3 bg-[var(--surface)]">
                      <div className="flex items-center gap-2">
                        <select value={r.round_type}
                          onChange={ev => updateRound(realIdx, { round_type: ev.target.value })}
                          className="flex-1 text-sm px-2 py-1.5 border border-[var(--border)] rounded-[var(--radius)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)]">
                          {ROUND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button type="button"
                          onClick={() => updateRound(realIdx, r._new ? { _delete: true } : { _delete: true })}
                          className="size-6 flex items-center justify-center text-[var(--foreground-muted)] hover:text-red-500 transition-colors shrink-0"
                          title="Delete round">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-[var(--foreground-muted)] mb-1">Amount</label>
                          <Input value={r.amount} onChange={ev => updateRound(realIdx, { amount: ev.target.value })}
                            type="number" placeholder="1000000" className="h-8 text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--foreground-muted)] mb-1">Currency</label>
                          <select value={r.currency} onChange={ev => updateRound(realIdx, { currency: ev.target.value })}
                            className="w-full text-xs px-2 py-1.5 h-8 border border-[var(--border)] rounded-[var(--radius)] bg-white focus:outline-none">
                            {['EUR', 'USD', 'GBP'].map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--foreground-muted)] mb-1">Date</label>
                          <Input value={r.date} onChange={ev => updateRound(realIdx, { date: ev.target.value })}
                            type="date" className="h-8 text-xs" />
                        </div>
                      </div>

                      {/* Investors on this round */}
                      <div>
                        <p className="text-xs text-[var(--foreground-muted)] mb-1.5">Investors</p>
                        {activeInvestors.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {activeInvestors.map((inv) => (
                              <span key={inv.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${inv.lead ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]' : 'bg-white border-[var(--border)] text-[var(--foreground-secondary)]'}`}>
                                {inv.lead && <span className="font-semibold">lead·</span>}
                                {inv.name}
                                {inv.unlinked && <span className="opacity-50 ml-0.5" title="Not linked to a directory profile">*</span>}
                                <button type="button"
                                  onClick={() => {
                                    const invRealIdx = r.investors.indexOf(inv);
                                    setRoundDrafts(prev => prev.map((rd, ri) => {
                                      if (ri !== realIdx) return rd;
                                      const newInvs = [...rd.investors];
                                      if (inv._new) newInvs.splice(invRealIdx, 1);
                                      else newInvs[invRealIdx] = { ...inv, _delete: true };
                                      return { ...rd, investors: newInvs };
                                    }));
                                  }}
                                  className="hover:text-red-500 ml-0.5">
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="space-y-1.5">
                          {unusedInvestors.length > 0 && (
                            <select
                              value=""
                              onChange={ev => { if (ev.target.value) addInvestorToRound(realIdx, ev.target.value); }}
                              className="w-full text-xs px-2 py-1.5 border border-dashed border-[var(--border)] rounded-[var(--radius)] bg-white focus:outline-none text-[var(--foreground-muted)]">
                              <option value="">+ Add from directory…</option>
                              {unusedInvestors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                          )}
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={freeTextNames[r.id] ?? ''}
                              onChange={ev => setFreeTextNames(prev => ({ ...prev, [r.id]: ev.target.value }))}
                              onKeyDown={ev => { if (ev.key === 'Enter') { ev.preventDefault(); addUnlinkedInvestor(r.id, freeTextNames[r.id] ?? ''); } }}
                              placeholder="Add investor not in directory…"
                              className="flex-1 text-xs px-2 py-1.5 border border-dashed border-[var(--border)] rounded-[var(--radius)] bg-white focus:outline-none focus:border-[var(--primary)] text-[var(--foreground-secondary)] placeholder:text-[var(--foreground-muted)]"
                            />
                            <button type="button"
                              onClick={() => addUnlinkedInvestor(r.id, freeTextNames[r.id] ?? '')}
                              className="px-2 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)] transition-colors shrink-0">
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {roundDrafts.filter(r => !r._delete).length === 0 && (
                  <p className="text-xs text-[var(--foreground-muted)] text-center py-3">No funding rounds yet</p>
                )}
              </div>
            </fieldset>
          )}
          {/* Team */}
          <fieldset>
            <div className="flex items-center justify-between mb-3">
              <legend className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">Team</legend>
              <button type="button"
                onClick={() => setTeamDrafts(prev => [...prev, { id: `new-${Date.now()}`, name: '', role: '', linkedin_url: '', _new: true }])}
                className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
                <Plus size={12} /> Add member
              </button>
            </div>
            <div className="space-y-2">
              {teamDrafts.filter(m => !m._delete).map((m) => {
                const realIdx = teamDrafts.indexOf(m);
                return (
                  <div key={m.id} className="border border-[var(--border)] rounded-[var(--radius-lg)] p-3 bg-[var(--surface)] space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          value={m.name}
                          onChange={ev => setTeamDrafts(prev => prev.map((d, i) => i === realIdx ? { ...d, name: ev.target.value } : d))}
                          placeholder="Full name"
                          className="text-sm px-2 py-1.5 border border-[var(--border)] rounded-[var(--radius)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                        <input
                          value={m.role}
                          onChange={ev => setTeamDrafts(prev => prev.map((d, i) => i === realIdx ? { ...d, role: ev.target.value } : d))}
                          placeholder="Role / title"
                          className="text-sm px-2 py-1.5 border border-[var(--border)] rounded-[var(--radius)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                      </div>
                      <button type="button"
                        onClick={() => setTeamDrafts(prev => prev.map((d, i) => i === realIdx ? (d._new ? { ...d, _delete: true } : { ...d, _delete: true }) : d))}
                        className="size-6 flex items-center justify-center text-[var(--foreground-muted)] hover:text-red-500 transition-colors shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      value={m.linkedin_url}
                      onChange={ev => setTeamDrafts(prev => prev.map((d, i) => i === realIdx ? { ...d, linkedin_url: ev.target.value } : d))}
                      placeholder="LinkedIn URL (optional)"
                      className="w-full text-xs px-2 py-1.5 border border-[var(--border)] rounded-[var(--radius)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-[var(--foreground-secondary)]"
                    />
                  </div>
                );
              })}
              {teamDrafts.filter(m => !m._delete).length === 0 && (
                <p className="text-xs text-[var(--foreground-muted)] text-center py-3">No team members yet</p>
              )}
            </div>
          </fieldset>
        </form>

        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave as any} disabled={saving} className="gap-1.5">
            <Save size={13} />
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </aside>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">{label}</label>
      {children}
    </div>
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
        <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors shrink-0">
          <Linkedin size={13} />
        </a>
      )}
    </div>
  );
}
