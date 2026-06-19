-- ==============================
-- startupmap.lu — initial schema
-- ==============================

-- Entities (startups, investors, accelerators, service providers)
create table entities (
  id            uuid default gen_random_uuid() primary key,
  type          text not null check (type in ('startup', 'investor', 'accelerator', 'service_provider')),
  name          text not null,
  slug          text unique not null,
  tagline       text,
  description   text,
  logo_url      text,
  website       text,
  founded_year  int,
  hq_address    text,
  city          text default 'Luxembourg City',
  lat           double precision,
  lng           double precision,
  linkedin_url  text,
  twitter_url   text,
  email         text,
  visible       boolean default true,
  featured      boolean default false,
  claimed       boolean default false,
  claimed_by    uuid references auth.users(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Startup-specific details
create table startup_details (
  entity_id      uuid references entities(id) on delete cascade primary key,
  sector         text,
  stage          text check (stage in ('idea','pre-seed','seed','series-a','series-b','series-c','growth','bootstrapped','acquired','ipo')),
  total_funding  bigint,
  employee_range text check (employee_range in ('1-10','11-50','51-200','201-500','500+')),
  b2b            boolean default true,
  b2c            boolean default false
);

-- Investor-specific details
create table investor_details (
  entity_id       uuid references entities(id) on delete cascade primary key,
  investor_type   text check (investor_type in ('vc','angel','corporate_vc','family_office','government','accelerator_fund')),
  focus_sectors   text[],
  ticket_min      bigint,
  ticket_max      bigint,
  stage_focus     text[],
  aum             bigint,
  portfolio_count int
);

-- Funding rounds
create table funding_rounds (
  id          uuid default gen_random_uuid() primary key,
  startup_id  uuid references entities(id) on delete cascade,
  round_type  text not null,
  amount      bigint,
  currency    text default 'EUR',
  date        date,
  announced   boolean default true,
  created_at  timestamptz default now()
);

-- Investors in a round
create table round_investors (
  round_id    uuid references funding_rounds(id) on delete cascade,
  investor_id uuid references entities(id) on delete cascade,
  lead        boolean default false,
  primary key (round_id, investor_id)
);

-- Events
create table events (
  id           uuid default gen_random_uuid() primary key,
  name         text not null,
  slug         text unique,
  description  text,
  start_date   timestamptz,
  end_date     timestamptz,
  location     text,
  city         text,
  lat          double precision,
  lng          double precision,
  url          text,
  image_url    text,
  organizer_id uuid references entities(id),
  type         text check (type in ('conference','meetup','hackathon','workshop','networking','demo-day','other')),
  virtual      boolean default false,
  visible      boolean default true,
  created_at   timestamptz default now()
);

-- Jobs
create table jobs (
  id          uuid default gen_random_uuid() primary key,
  entity_id   uuid references entities(id) on delete cascade,
  title       text not null,
  description text,
  location    text,
  remote      text check (remote in ('yes','no','hybrid')),
  type        text check (type in ('full-time','part-time','contract','internship')),
  url         text,
  salary_min  int,
  salary_max  int,
  currency    text default 'EUR',
  posted_at   timestamptz default now(),
  expires_at  timestamptz,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- Submissions
create table submissions (
  id               uuid default gen_random_uuid() primary key,
  submitted_by     uuid references auth.users(id),
  entity_name      text not null,
  entity_type      text,
  website          text,
  description      text,
  submitter_email  text,
  status           text default 'pending' check (status in ('pending','approved','rejected')),
  admin_notes      text,
  created_at       timestamptz default now()
);

-- User profiles
create table profiles (
  id         uuid references auth.users(id) primary key,
  full_name  text,
  avatar_url text,
  role       text,
  entity_id  uuid references entities(id),
  is_admin   boolean default false,
  created_at timestamptz default now()
);

-- Claim requests
create table claim_requests (
  id         uuid default gen_random_uuid() primary key,
  entity_id  uuid references entities(id),
  user_id    uuid references auth.users(id),
  evidence   text,
  status     text default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

-- ==============================
-- Row Level Security
-- ==============================

alter table entities enable row level security;
alter table startup_details enable row level security;
alter table investor_details enable row level security;
alter table funding_rounds enable row level security;
alter table round_investors enable row level security;
alter table events enable row level security;
alter table jobs enable row level security;
alter table submissions enable row level security;
alter table profiles enable row level security;
alter table claim_requests enable row level security;

-- Public read for visible entities
create policy "Public read entities" on entities for select using (visible = true);
create policy "Public read startup_details" on startup_details for select using (
  exists (select 1 from entities e where e.id = entity_id and e.visible = true)
);
create policy "Public read investor_details" on investor_details for select using (
  exists (select 1 from entities e where e.id = entity_id and e.visible = true)
);
create policy "Public read funding_rounds" on funding_rounds for select using (announced = true);
create policy "Public read round_investors" on round_investors for select using (true);
create policy "Public read events" on events for select using (visible = true);
create policy "Public read jobs" on jobs for select using (active = true);
create policy "Public read profiles" on profiles for select using (true);

-- Submissions: anyone can insert, owner can read theirs
create policy "Anyone can submit" on submissions for insert with check (true);
create policy "Owner reads own submissions" on submissions for select using (
  submitted_by = auth.uid()
);

-- Claim requests: authenticated users
create policy "Auth can claim" on claim_requests for insert with check (auth.uid() = user_id);
create policy "Owner reads own claims" on claim_requests for select using (user_id = auth.uid());

-- Profiles: users manage their own
create policy "Users manage own profile" on profiles for all using (id = auth.uid());

-- Claimed entity owners can update
create policy "Claimed owners update entity" on entities for update using (claimed_by = auth.uid());

-- ==============================
-- Auto-create profile on signup
-- ==============================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================
-- Indexes
-- ==============================
create index on entities (type, visible);
create index on entities (slug);
create index on entities (city);
create index on startup_details (sector);
create index on startup_details (stage);
create index on events (start_date, visible);
create index on jobs (active, posted_at desc);
