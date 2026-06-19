import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  ComposedChart, Line, CartesianGrid,
} from 'recharts';
import { TrendingUp, Hash, BarChart2, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Entity } from '@/lib/supabase';
import { getInitials } from '@/lib/utils';

function fmt(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n}`;
}

const COLORS = ['#6b5ce7', '#a78bfa', '#38bdf8', '#34d399', '#fb923c', '#f43f5e'];
const STAGE_ORDER = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth'];

interface YearData { year: string; amount: number; deals: number }
interface StageData { name: string; value: number; deals: number }
interface SectorData { sector: string; amount: number; deals: number }
interface InvestorRow { entity: Entity; deals: number; amount: number }
interface StartupRow { entity: Entity; total: number }
interface RecentRound { id: string; round_type: string; amount: number; date: string; startup?: Entity }

export default function FundingPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, rounds: 0, avgSize: 0, investors: 0 });
  const [byYear, setByYear] = useState<YearData[]>([]);
  const [byStage, setByStage] = useState<StageData[]>([]);
  const [bySector, setBySector] = useState<SectorData[]>([]);
  const [topStartups, setTopStartups] = useState<StartupRow[]>([]);
  const [activeInvestors, setActiveInvestors] = useState<InvestorRow[]>([]);
  const [recentRounds, setRecentRounds] = useState<RecentRound[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [{ data: rounds }, { data: entities }, { data: riList }] = await Promise.all([
      supabase.from('funding_rounds').select('*').order('date', { ascending: false }),
      supabase.from('entities').select('*, startup_details(*), investor_details(*)').eq('visible', true),
      supabase.from('round_investors').select('*'),
    ]);

    if (!rounds || !entities) { setLoading(false); return; }

    const entityMap = new Map<string, Entity>((entities as Entity[]).map(e => [e.id, e]));
    const ri = (riList as any[]) || [];

    // Stats
    const total = (rounds as any[]).reduce((s: number, r: any) => s + (r.amount || 0), 0);
    const investorIds = new Set(ri.map((x: any) => x.investor_id));
    setStats({ total, rounds: rounds.length, avgSize: rounds.length ? total / rounds.length : 0, investors: investorIds.size });

    // By year
    const yearMap = new Map<string, { amount: number; deals: number }>();
    for (const r of rounds as any[]) {
      const year = r.date?.slice(0, 4) ?? 'Unknown';
      const cur = yearMap.get(year) ?? { amount: 0, deals: 0 };
      yearMap.set(year, { amount: cur.amount + (r.amount || 0), deals: cur.deals + 1 });
    }
    const sortedYears = [...yearMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    let cumulative = 0;
    setByYear(sortedYears.map(([year, v]) => {
      cumulative += v.amount;
      return { year, ...v, cumulative };
    }));

    // By stage
    const stageMap = new Map<string, { value: number; deals: number }>();
    for (const r of rounds as any[]) {
      const stage = r.round_type ?? 'Other';
      const cur = stageMap.get(stage) ?? { value: 0, deals: 0 };
      stageMap.set(stage, { value: cur.value + (r.amount || 0), deals: cur.deals + 1 });
    }
    setByStage(
      [...stageMap.entries()]
        .sort((a, b) => {
          const ai = STAGE_ORDER.indexOf(a[0]);
          const bi = STAGE_ORDER.indexOf(b[0]);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        })
        .map(([name, v]) => ({ name, ...v }))
    );

    // By sector
    const sectorMap = new Map<string, { amount: number; deals: number }>();
    for (const r of rounds as any[]) {
      const startup = entityMap.get(r.startup_id);
      const sector = (startup as any)?.startup_details?.sector ?? 'Other';
      const cur = sectorMap.get(sector) ?? { amount: 0, deals: 0 };
      sectorMap.set(sector, { amount: cur.amount + (r.amount || 0), deals: cur.deals + 1 });
    }
    setBySector([...sectorMap.entries()].sort((a, b) => b[1].amount - a[1].amount).map(([sector, v]) => ({ sector, ...v })));

    // Top startups
    const startupFunding = new Map<string, number>();
    for (const r of rounds as any[]) {
      startupFunding.set(r.startup_id, (startupFunding.get(r.startup_id) ?? 0) + (r.amount || 0));
    }
    setTopStartups(
      [...startupFunding.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id, total]) => ({ entity: entityMap.get(id)!, total }))
        .filter(x => x.entity)
    );

    // Active investors
    const invDeals = new Map<string, { deals: number; amount: number }>();
    for (const x of ri) {
      const round = (rounds as any[]).find((r: any) => r.id === x.round_id);
      const cur = invDeals.get(x.investor_id) ?? { deals: 0, amount: 0 };
      invDeals.set(x.investor_id, { deals: cur.deals + 1, amount: cur.amount + (round?.amount || 0) });
    }
    setActiveInvestors(
      [...invDeals.entries()]
        .sort((a, b) => b[1].deals - a[1].deals)
        .map(([id, v]) => ({ entity: entityMap.get(id)!, ...v }))
        .filter(x => x.entity)
    );

    // Recent rounds
    setRecentRounds(
      (rounds as any[]).slice(0, 6).map((r: any) => ({ ...r, startup: entityMap.get(r.startup_id) }))
    );

    setLoading(false);
  }

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-10 bg-[var(--surface)] rounded-[var(--radius-xl)] animate-pulse" />
      ))}
    </div>
  );

  const maxSector = bySector[0]?.amount ?? 1;
  const maxStartup = topStartups[0]?.total ?? 1;

  return (
    <>
      <Helmet>
        <title>Funding — startupmap.lu</title>
        <meta name="description" content="Luxembourg startup funding tracker — rounds, investors and sector breakdown." />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Funding tracker</h1>
          <p className="text-sm text-[var(--foreground-secondary)] mt-1">Capital raised by Luxembourg ecosystem companies, tracked by startupmap.lu</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<TrendingUp size={15} />} label="Total capital tracked" value={fmt(stats.total)} />
          <StatCard icon={<Hash size={15} />} label="Funding rounds" value={String(stats.rounds)} />
          <StatCard icon={<BarChart2 size={15} />} label="Average round size" value={fmt(stats.avgSize)} />
          <StatCard icon={<Users size={15} />} label="Active investors" value={String(stats.investors)} />
        </div>

        {/* Year + Stage charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-5">Funding by year</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byYear} barSize={30} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} />
                <Tooltip
                  formatter={(v: number) => [fmt(v), 'Capital raised']}
                  labelStyle={{ fontSize: 12, fontWeight: 600, color: '#0f0f10' }}
                  contentStyle={{ fontSize: 12, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                  cursor={{ fill: '#f8f8fa' }}
                />
                <Bar dataKey="amount" fill="#6b5ce7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-5">By stage</h2>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStage} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                    {byStage.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [fmt(v), 'Raised']}
                    contentStyle={{ fontSize: 12, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cumulative tracker */}
        <div className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Yearly tracker</h2>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Annual capital raised (bars) vs. cumulative total (line)</p>
            </div>
            <span className="text-xs text-[var(--foreground-muted)] bg-[var(--surface)] px-2 py-1 rounded-[var(--radius)]">
              {byYear[0]?.year} – {byYear[byYear.length - 1]?.year}
            </span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={byYear} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tickFormatter={fmt} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={fmt} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={56} />
                <Tooltip
                  formatter={(value: number, name: string) => [fmt(value), name === 'amount' ? 'Raised this year' : 'Cumulative total']}
                  labelStyle={{ fontSize: 12, fontWeight: 600, color: '#0f0f10' }}
                  contentStyle={{ fontSize: 12, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                  cursor={{ fill: '#f8f8fa' }}
                />
                <Bar yAxisId="left" dataKey="amount" fill="#6b5ce7" opacity={0.25} radius={[4, 4, 0, 0]} barSize={32} />
                <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#6b5ce7" strokeWidth={2.5} dot={{ fill: '#6b5ce7', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector bars */}
        <div className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-5">Capital by sector</h2>
          <div className="space-y-4">
            {bySector.map((s, i) => (
              <div key={s.sector}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[var(--foreground-secondary)]">{s.sector}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[var(--foreground-muted)]">{s.deals} round{s.deals !== 1 ? 's' : ''}</span>
                    <span className="text-sm font-medium text-[var(--foreground)] w-14 text-right">{fmt(s.amount)}</span>
                  </div>
                </div>
                <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(s.amount / maxSector) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investors + Recent rounds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Most active investors</h2>
            <div className="space-y-1">
              {activeInvestors.map((inv, i) => (
                <Link
                  key={inv.entity.id}
                  to={`/entity/${inv.entity.slug || inv.entity.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] hover:bg-[var(--surface)] transition-colors group"
                >
                  <span className="w-4 text-xs text-[var(--foreground-muted)] text-right shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-[var(--radius)] bg-green-50 text-green-700 text-xs font-semibold flex items-center justify-center shrink-0">
                    {getInitials(inv.entity.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">{inv.entity.name}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">{fmt(inv.amount)} deployed</p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded-full shrink-0">
                    {inv.deals} deal{inv.deals !== 1 ? 's' : ''}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Recent rounds</h2>
            <div className="space-y-1">
              {recentRounds.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--primary-light)] text-[var(--primary)] text-xs font-semibold flex items-center justify-center shrink-0">
                    {r.startup ? getInitials(r.startup.name) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    {r.startup ? (
                      <Link to={`/entity/${r.startup.slug || r.startup.id}`} className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors block truncate">
                        {r.startup.name}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-[var(--foreground)]">Unknown</p>
                    )}
                    <p className="text-xs text-[var(--foreground-muted)]">{r.round_type} · {r.date?.slice(0, 4)}</p>
                  </div>
                  {r.amount && (
                    <span className="text-sm font-semibold text-[var(--foreground)] shrink-0">{fmt(r.amount)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top funded startups */}
        <div className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-5">Top funded startups</h2>
          <div className="space-y-4">
            {topStartups.map((s, i) => (
              <div key={s.entity.id}>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="w-4 text-xs text-[var(--foreground-muted)] text-right shrink-0">{i + 1}</span>
                  <Link to={`/entity/${s.entity.slug || s.entity.id}`} className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors flex-1 truncate">
                    {s.entity.name}
                  </Link>
                  <span className="text-sm font-semibold text-[var(--foreground)] w-14 text-right shrink-0">{fmt(s.total)}</span>
                </div>
                <div className="ml-7 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--primary)]"
                    style={{ width: `${(s.total / maxStartup) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-[var(--radius-xl)] p-4">
      <div className="flex items-center gap-1.5 text-[var(--foreground-muted)] mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">{value}</p>
    </div>
  );
}
