import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  if (amount >= 1_000_000_000) return `€${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  startup: 'Startup',
  investor: 'Investor',
  accelerator: 'Accelerator',
  service_provider: 'Service Provider',
};

export const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea',
  'pre-seed': 'Pre-seed',
  seed: 'Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  'series-c': 'Series C',
  growth: 'Growth',
  bootstrapped: 'Bootstrapped',
  acquired: 'Acquired',
  ipo: 'IPO',
};

export const SECTORS = [
  'Fintech', 'Healthtech', 'Legaltech', 'SaaS', 'E-commerce',
  'Cybersecurity', 'AI / ML', 'Logistics', 'Space Tech', 'Cleantech',
  'Edtech', 'Proptech', 'HR Tech', 'Regtech', 'Data & Analytics',
  'Media & Entertainment', 'Gaming', 'Blockchain / Web3', 'Biotech', 'Other',
];

export const LU_CITIES = [
  'Luxembourg City', 'Esch-sur-Alzette', 'Differdange', 'Dudelange',
  'Ettelbruck', 'Diekirch', 'Wiltz', 'Echternach', 'Remich', 'Grevenmacher',
];
