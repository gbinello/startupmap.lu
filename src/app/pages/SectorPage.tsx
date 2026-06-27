import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import EntityCard from '../components/EntityCard';
import { supabase } from '@/lib/supabase';
import type { Entity } from '@/lib/supabase';

// ─── Sector catalogue ────────────────────────────────────────────────────────

export interface SectorInfo {
  name: string;
  slug: string;
  headline: string;
  description: string;
  tags: string[];
}

export const SECTORS: SectorInfo[] = [
  {
    name: 'Fintech',
    slug: 'fintech',
    headline: 'Fintech in Luxembourg',
    description: "Luxembourg is Europe's second-largest investment fund domicile and home to more than 130 banks, making it one of the most fertile grounds for fintech on the continent. Startups here tackle payments infrastructure, asset management tooling, wealth management, banking-as-a-service and regulatory technology — with direct access to institutional capital and EU passporting rights from day one.",
    tags: ['Payments', 'Asset management', 'Regtech', 'Banking-as-a-service', 'WealthTech'],
  },
  {
    name: 'Healthtech',
    slug: 'healthtech',
    headline: 'Healthtech in Luxembourg',
    description: "Anchored by the Luxembourg Institute of Health (LIH) and a cross-border talent draw from France, Belgium and Germany, Luxembourg's healthtech cluster spans digital therapeutics, clinical data platforms, hospital software and precision medicine. Public funding from the FNR (National Research Fund) and proximity to leading European health institutions give startups here a strong research foundation.",
    tags: ['Digital therapeutics', 'Clinical data', 'Precision medicine', 'Hospital software', 'MedTech'],
  },
  {
    name: 'Legaltech',
    slug: 'legaltech',
    headline: 'Legaltech in Luxembourg',
    description: "A dense concentration of international law firms, EU institutions and financial service providers creates persistent demand for legal automation, contract management, e-discovery and compliance tooling. Luxembourg's legaltech scene is tightly linked to financial regulation — startups often serve the fund industry, banking sector and cross-border M&A activity.",
    tags: ['Contract automation', 'Legal AI', 'Compliance', 'E-discovery', 'Fund administration'],
  },
  {
    name: 'SaaS',
    slug: 'saas',
    headline: 'SaaS startups in Luxembourg',
    description: "Luxembourg's highly international corporate market — with hundreds of multinationals using the country as their EU headquarters — creates a strong B2B SaaS demand base. Startups building finance, HR, compliance and workflow automation tools find a ready pool of early enterprise customers within the Grand Duchy itself, before scaling across the EU.",
    tags: ['B2B SaaS', 'Enterprise software', 'Workflow automation', 'HR software', 'Finance tools'],
  },
  {
    name: 'E-commerce',
    slug: 'e-commerce',
    headline: 'E-commerce startups in Luxembourg',
    description: "Favourable logistics infrastructure and proximity to major European distribution networks make Luxembourg a practical base for cross-border e-commerce ventures. The local market punches above its weight in per-capita online spend, and the country's central location enables startups to serve France, Belgium, Germany and the Netherlands from a single operation.",
    tags: ['Cross-border retail', 'Fulfilment', 'Marketplace', 'D2C', 'Logistics software'],
  },
  {
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    headline: 'Cybersecurity startups in Luxembourg',
    description: "The presence of major EU institutions, international banks and data-sensitive financial players drives consistent demand for cybersecurity solutions. The University of Luxembourg's SnT (Interdisciplinary Centre for Security, Reliability and Trust) is a top-tier EU cybersecurity research hub, regularly spinning out startups focused on network security, threat intelligence and secure communications.",
    tags: ['Threat intelligence', 'Network security', 'Identity & Access', 'GRC', 'Secure comms'],
  },
  {
    name: 'AI / ML',
    slug: 'ai-ml',
    headline: 'AI & ML startups in Luxembourg',
    description: "Spun out of SnT and the Luxembourg Institute of Science and Technology (LIST), AI startups here apply machine learning to finance, logistics, healthcare and smart manufacturing. The national AI strategy (2019) has sustained public investment, and the proximity to financial data from the fund industry gives AI companies an unusual advantage in applied finance ML.",
    tags: ['Applied ML', 'NLP', 'Computer vision', 'AI for finance', 'Generative AI'],
  },
  {
    name: 'Logistics',
    slug: 'logistics',
    headline: 'Logistics & supply chain startups in Luxembourg',
    description: "Luxembourg sits at the intersection of Europe's key freight corridors — Antwerp, the Rhine waterway, major road and rail networks, and Cargolux (one of the world's largest cargo airlines). This infrastructure has spawned a cluster of startups in freight visibility, last-mile logistics, supply chain analytics and autonomous vehicles.",
    tags: ['Freight tech', 'Last-mile', 'Supply chain', 'Fleet management', 'Cargo analytics'],
  },
  {
    name: 'Space Tech',
    slug: 'space-tech',
    headline: 'Space tech startups in Luxembourg',
    description: "Luxembourg was the first European country to pass legislation allowing private companies to own resources extracted in outer space (2017). The SpaceResources.lu initiative and LuxIMPULSE programme have attracted a global community of space startups — from satellite data analytics and in-orbit servicing to resource extraction and space situational awareness. For a country of 670,000 people, the space ecosystem is exceptional.",
    tags: ['Satellite data', 'In-orbit servicing', 'Space resources', 'Launch', 'Space situational awareness'],
  },
  {
    name: 'Cleantech',
    slug: 'cleantech',
    headline: 'Cleantech & sustainability startups in Luxembourg',
    description: "The government's circular economy strategy and direct alignment with the EU Green Deal are driving investment in renewable energy, sustainable materials, green logistics and environmental monitoring. Luxembourg's strong private equity ecosystem provides patient capital for deep-tech cleantech, and the Luxembourg Sustainable Finance Initiative (LSFI) creates a natural demand base for green financial products.",
    tags: ['Renewable energy', 'Circular economy', 'Green finance', 'Carbon markets', 'Sustainable materials'],
  },
  {
    name: 'Edtech',
    slug: 'edtech',
    headline: 'Edtech startups in Luxembourg',
    description: "With a highly international workforce and a multilingual population speaking Luxembourgish, French, German and English, Luxembourg has a unique market for language learning platforms, multilingual corporate training and educational software. The presence of European institutions and international schools creates a concentrated, high-value education market.",
    tags: ['Language learning', 'Corporate training', 'LMS', 'E-learning', 'Skills platforms'],
  },
  {
    name: 'Proptech',
    slug: 'proptech',
    headline: 'Proptech startups in Luxembourg',
    description: "Luxembourg has one of the most expensive real estate markets in Europe and an active construction sector driven by population growth and cross-border workers. This creates strong demand for property management platforms, construction tech, smart building solutions and real estate investment tooling — particularly for the commercial and residential rental market.",
    tags: ['Property management', 'Construction tech', 'Smart buildings', 'Real estate investment', 'Rental platforms'],
  },
  {
    name: 'HR Tech',
    slug: 'hr-tech',
    headline: 'HR tech startups in Luxembourg',
    description: "As a major employer hub drawing talent from 170+ nationalities, Luxembourg has persistent demand for international payroll, relocation management, talent acquisition platforms and workforce analytics. Cross-border employment — where companies hire across France, Belgium and Germany daily — creates unique compliance complexity that HR tech startups are well-placed to solve.",
    tags: ['Payroll', 'Talent acquisition', 'Workforce analytics', 'Relocation', 'Cross-border HR'],
  },
  {
    name: 'Regtech',
    slug: 'regtech',
    headline: 'Regtech startups in Luxembourg',
    description: "EU regulatory complexity — MiFID II, GDPR, DORA, AIFMD, CSRD — creates a near-permanent demand for compliance automation. Luxembourg's regtech scene focuses primarily on financial services regulation, AML/KYC, ESG reporting and fund compliance. The CSSF (financial regulator) has been proactive in engaging with regtech solutions, making Luxembourg a live testing ground.",
    tags: ['AML / KYC', 'Fund compliance', 'ESG reporting', 'GDPR', 'Regulatory reporting'],
  },
  {
    name: 'Data & Analytics',
    slug: 'data-analytics',
    headline: 'Data & analytics startups in Luxembourg',
    description: "Luxembourg's financial sector generates enormous volumes of structured data around funds, transactions, custody and compliance — driving demand for specialised analytics, reporting and BI tools. Startups in this space often serve asset managers, banks and insurance companies with tailored data products that couldn't be built by generic BI vendors.",
    tags: ['Financial analytics', 'Fund reporting', 'BI tools', 'Data pipelines', 'ESG data'],
  },
  {
    name: 'Media & Entertainment',
    slug: 'media-entertainment',
    headline: 'Media & entertainment startups in Luxembourg',
    description: "Luxembourg punches above its weight in media — RTL Group (one of Europe's largest commercial broadcasters) is headquartered here, and the country has a long history in satellite communications via SES. This legacy has seeded a community of startups working in content distribution, streaming infrastructure, digital publishing and creator tools.",
    tags: ['Streaming', 'Content distribution', 'Digital publishing', 'Creator tools', 'Satellite media'],
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    headline: 'Gaming startups in Luxembourg',
    description: "An emerging but growing cluster, with indie studios and gaming-adjacent startups building in interactive entertainment, serious games and gamification for enterprise. The low cost of office space relative to major European cities makes Luxembourg attractive for small gaming teams, and public funding from Luxinnovation supports game development projects.",
    tags: ['Indie games', 'Serious games', 'Gamification', 'Interactive entertainment', 'Game tooling'],
  },
  {
    name: 'Blockchain / Web3',
    slug: 'blockchain-web3',
    headline: 'Blockchain & Web3 startups in Luxembourg',
    description: "Luxembourg's financial infrastructure focus means its web3 scene skews toward institutional use cases — real-world assets on-chain, tokenised funds, digital bonds and institutional DeFi — rather than consumer crypto. The CSSF has issued regulatory guidance on digital assets, giving compliant blockchain projects a clearer path to operate within the EU's financial framework.",
    tags: ['Tokenisation', 'DeFi', 'Digital assets', 'Blockchain infrastructure', 'RWA'],
  },
  {
    name: 'Biotech',
    slug: 'biotech',
    headline: 'Biotech startups in Luxembourg',
    description: "The Luxembourg Centre for Systems Biomedicine (LCSB) at the University of Luxembourg is a globally recognised centre for Parkinson's disease research, microbiome science and computational biology. The FNR funds a pipeline of biotech spin-outs, and the cross-border BioValley region connecting Luxembourg, Alsace and Baden-Wurttemberg provides access to a deep talent and research network.",
    tags: ['Computational biology', 'Microbiome', 'Precision medicine', 'Drug discovery', 'BioPharma'],
  },
  {
    name: 'Other',
    slug: 'other',
    headline: 'Other innovative startups in Luxembourg',
    description: "Not every breakthrough fits a predefined category. Luxembourg's startup ecosystem includes companies building across disciplines — from new materials and agri-tech to mobility, retail innovation and social impact ventures. The Grand Duchy's open, international culture makes it a natural home for founders working on ideas that are genuinely hard to classify.",
    tags: ['Cross-sector', 'Deep tech', 'Social impact', 'Innovation'],
  },
];

export const SECTOR_BY_SLUG = Object.fromEntries(SECTORS.map(s => [s.slug, s]));
export const SECTOR_BY_NAME = Object.fromEntries(SECTORS.map(s => [s.name, s]));

// ─── Page component ───────────────────────────────────────────────────────────

export default function SectorPage() {
  const { slug } = useParams<{ slug: string }>();
  const sector = slug ? SECTOR_BY_SLUG[slug] : null;

  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sector) return;
    loadEntities(sector.name);
  }, [sector?.name]);

  async function loadEntities(sectorName: string) {
    setLoading(true);
    const { data } = await supabase
      .from('entities')
      .select('*, startup_details(*), investor_details(*)')
      .eq('visible', true)
      .order('featured', { ascending: false })
      .order('name');

    const all = (data as Entity[]) || [];
    const filtered = all.filter(e =>
      e.startup_details?.sector === sectorName ||
      e.investor_details?.focus_sectors?.includes(sectorName)
    );
    setEntities(filtered);
    setLoading(false);
  }

  if (!sector) return <Navigate to="/directory" replace />;

  const startups = entities.filter(e => e.type === 'startup');
  const investors = entities.filter(e => e.type === 'investor');
  const others = entities.filter(e => e.type !== 'startup' && e.type !== 'investor');

  return (
    <>
      <Helmet>
        <title>{sector.headline} | startupmap.lu</title>
        <meta name="description" content={sector.description.slice(0, 160)} />
        <link rel="canonical" href={`https://startupmap.lu/sector/${sector.slug}`} />
        <meta property="og:title" content={`${sector.headline} | startupmap.lu`} />
        <meta property="og:description" content={sector.description.slice(0, 160)} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://startupmap.lu/sector/${sector.slug}`} />
        <meta property="og:site_name" content="startupmap.lu" />
        <meta name="twitter:card" content="summary" />
      </Helmet>

      {/* Hero */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <Link
            to="/directory"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> All sectors
          </Link>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--foreground)] leading-tight mb-4">
            {sector.headline}
          </h1>
          <p className="text-base text-[var(--foreground-secondary)] max-w-2xl leading-relaxed mb-5">
            {sector.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {sector.tags.map(tag => (
              <span key={tag} className="px-2.5 py-0.5 text-xs rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-medium">
                {tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          {!loading && (
            <div className="flex items-center gap-5 text-sm">
              {startups.length > 0 && (
                <span className="text-[var(--foreground-secondary)]">
                  <span className="font-semibold text-[var(--foreground)] tabular-nums">{startups.length}</span> startup{startups.length !== 1 ? 's' : ''}
                </span>
              )}
              {investors.length > 0 && (
                <span className="text-[var(--foreground-secondary)]">
                  <span className="font-semibold text-[var(--foreground)] tabular-nums">{investors.length}</span> investor{investors.length !== 1 ? 's' : ''}
                </span>
              )}
              {others.length > 0 && (
                <span className="text-[var(--foreground-secondary)]">
                  <span className="font-semibold text-[var(--foreground)] tabular-nums">{others.length}</span> other{others.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Entity grids */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 bg-[var(--surface)] rounded-[var(--radius-lg)] animate-pulse" />
            ))}
          </div>
        ) : entities.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-[var(--foreground-secondary)] mb-4">No entities listed yet in this sector.</p>
            <Button asChild>
              <Link to="/submit">Submit your company</Link>
            </Button>
          </div>
        ) : (
          <>
            {startups.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">
                  Startups <span className="text-[var(--foreground-muted)] font-normal">({startups.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {startups.map(e => <EntityCard key={e.id} entity={e} />)}
                </div>
              </section>
            )}

            {investors.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">
                  Investors <span className="text-[var(--foreground-muted)] font-normal">({investors.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {investors.map(e => <EntityCard key={e.id} entity={e} />)}
                </div>
              </section>
            )}

            {others.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">
                  Others <span className="text-[var(--foreground-muted)] font-normal">({others.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {others.map(e => <EntityCard key={e.id} entity={e} />)}
                </div>
              </section>
            )}
          </>
        )}

        {/* CTA */}
        <div className="bg-[var(--primary-light)] border border-[var(--primary-light-hover)] rounded-[var(--radius-2xl)] p-8 text-center">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-2">
            Missing from this list?
          </h2>
          <p className="text-sm text-[var(--foreground-secondary)] mb-5 max-w-sm mx-auto">
            Submit your {sector.name} company and join the Luxembourg startup directory.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/submit">Submit a listing</Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to={`/directory?sector=${encodeURIComponent(sector.name)}`} className="gap-1.5">
                Full {sector.name} directory <ArrowRight size={13} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
