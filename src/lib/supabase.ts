import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isDemo = !supabaseUrl || supabaseUrl.includes('placeholder');

export const supabase = isDemo
  ? (mockSupabase as any)
  : createClient(supabaseUrl, supabaseAnonKey);

export type EntityType = 'startup' | 'investor' | 'accelerator' | 'service_provider';

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  founded_year?: number;
  hq_address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  linkedin_url?: string;
  twitter_url?: string;
  email?: string;
  visible: boolean;
  featured: boolean;
  claimed: boolean;
  claimed_by?: string;
  created_at: string;
  startup_details?: StartupDetails;
  investor_details?: InvestorDetails;
  funding_rounds?: FundingRound[];
}

export interface StartupDetails {
  entity_id: string;
  sector?: string;
  stage?: string;
  total_funding?: number;
  employee_range?: string;
  b2b?: boolean;
  b2c?: boolean;
}

export interface InvestorDetails {
  entity_id: string;
  investor_type?: string;
  focus_sectors?: string[];
  ticket_min?: number;
  ticket_max?: number;
  stage_focus?: string[];
  portfolio_count?: number;
}

export interface FundingRound {
  id: string;
  startup_id: string;
  round_type: string;
  amount?: number;
  currency: string;
  date?: string;
  announced: boolean;
  round_investors?: { investor: Entity; lead: boolean }[];
}

export interface Event {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  city?: string;
  url?: string;
  image_url?: string;
  organizer_id?: string;
  type?: string;
  virtual: boolean;
  visible: boolean;
  created_at: string;
}

export interface TeamMember {
  id: string;
  entity_id: string;
  name: string;
  role: string;
  linkedin_url?: string;
  avatar_url?: string;
}

export interface Job {
  id: string;
  entity_id: string;
  title: string;
  description?: string;
  location?: string;
  remote?: string;
  type?: string;
  url?: string;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  posted_at: string;
  expires_at?: string;
  active: boolean;
  entity?: Entity;
}
