-- ============================================================
-- EduPath SA – Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- PROFILES  (extends auth.users)
-- ────────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  full_name     text,
  grade         text,                    -- e.g. "Grade 12", "Matric pass"
  province      text,
  preferred_lang text default 'en',
  career_goals  text,
  study_budget  numeric(12,2),
  role          text default 'student',  -- student | content_admin | support_adviser | system_admin
  avatar_url    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- SUBJECTS  (learner's school subjects & marks)
-- ────────────────────────────────────────────────────────────
create table public.student_subjects (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  subject    text not null,
  mark       integer check (mark between 0 and 100),
  created_at timestamptz default now()
);

alter table public.student_subjects enable row level security;

create policy "Students manage own subjects"
  on public.student_subjects for all using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- APPLICATIONS  (application tracker)
-- ────────────────────────────────────────────────────────────
create type application_status as enum (
  'not_started', 'in_progress', 'submitted', 'awaiting_response', 'accepted', 'unsuccessful'
);

create table public.applications (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  institution     text not null,
  programme       text not null,
  status          application_status default 'not_started',
  deadline        date,
  notes           text,
  official_url    text,
  documents_ready boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.applications enable row level security;

create policy "Students manage own applications"
  on public.applications for all using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- FUNDING OPPORTUNITIES  (content managed by admins)
-- ────────────────────────────────────────────────────────────
create table public.funding_opportunities (
  id                uuid default uuid_generate_v4() primary key,
  name              text not null,
  funder            text,
  type              text,        -- bursary | scholarship | loan | nsfas | other
  description       text,
  eligibility       text,
  max_income        numeric(12,2),
  closing_date      date,
  official_url      text,
  last_verified     date,
  is_active         boolean default true,
  created_at        timestamptz default now()
);

alter table public.funding_opportunities enable row level security;

create policy "Anyone can view active funding"
  on public.funding_opportunities for select using (is_active = true);
create policy "Admins can manage funding"
  on public.funding_opportunities for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('content_admin','system_admin'))
  );

-- ────────────────────────────────────────────────────────────
-- SAVED FUNDING  (student bookmarks)
-- ────────────────────────────────────────────────────────────
create table public.saved_funding (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  funding_id   uuid references public.funding_opportunities(id) on delete cascade not null,
  notes        text,
  created_at   timestamptz default now(),
  unique(user_id, funding_id)
);

alter table public.saved_funding enable row level security;

create policy "Students manage own saved funding"
  on public.saved_funding for all using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- COST PLANS  (study budget calculator)
-- ────────────────────────────────────────────────────────────
create table public.cost_plans (
  id                uuid default uuid_generate_v4() primary key,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  label             text default 'My Budget',
  institution       text,
  tuition           numeric(12,2) default 0,
  accommodation     numeric(12,2) default 0,
  transport         numeric(12,2) default 0,
  food              numeric(12,2) default 0,
  books             numeric(12,2) default 0,
  data              numeric(12,2) default 0,
  other             numeric(12,2) default 0,
  bursary_income    numeric(12,2) default 0,
  nsfas_income      numeric(12,2) default 0,
  personal_income   numeric(12,2) default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.cost_plans enable row level security;

create policy "Students manage own cost plans"
  on public.cost_plans for all using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- ACADEMIC GOALS & MILESTONES
-- ────────────────────────────────────────────────────────────
create table public.academic_goals (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  title       text not null,
  description text,
  due_date    date,
  completed   boolean default false,
  created_at  timestamptz default now()
);

alter table public.academic_goals enable row level security;

create policy "Students manage own goals"
  on public.academic_goals for all using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- SUPPORT RESOURCES  (content managed by admins)
-- ────────────────────────────────────────────────────────────
create table public.support_resources (
  id           uuid default uuid_generate_v4() primary key,
  category     text,   -- counselling | disability | financial_aid | crisis | general
  title        text not null,
  description  text,
  phone        text,
  email        text,
  website_url  text,
  province     text,   -- null = national
  is_active    boolean default true,
  created_at   timestamptz default now()
);

alter table public.support_resources enable row level security;

create policy "Anyone can view active resources"
  on public.support_resources for select using (is_active = true);
create policy "Admins can manage resources"
  on public.support_resources for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('content_admin','system_admin'))
  );

-- ────────────────────────────────────────────────────────────
-- AI PATHWAY RECOMMENDATIONS  (cached Gemini results)
-- ────────────────────────────────────────────────────────────
create table public.pathway_recommendations (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  subjects_snapshot jsonb,     -- snapshot of marks used
  recommendations   jsonb,     -- parsed Gemini response
  raw_prompt        text,
  created_at   timestamptz default now()
);

alter table public.pathway_recommendations enable row level security;

create policy "Students view own recommendations"
  on public.pathway_recommendations for all using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- STUDENT EXPERIENCES  (community reviews)
-- ────────────────────────────────────────────────────────────
create table public.student_experiences (
  id               uuid default uuid_generate_v4() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  institution      text not null,
  course           text not null,
  year_attended    integer,
  rating           integer check (rating between 1 and 5),
  experience_text  text not null,
  created_at       timestamptz default now()
);

alter table public.student_experiences enable row level security;

-- Anyone can read; authenticated users can insert their own
create policy "Anyone can view experiences"
  on public.student_experiences for select using (true);
create policy "Students can insert own experiences"
  on public.student_experiences for insert with check (auth.uid() = user_id);
create policy "Students can delete own experiences"
  on public.student_experiences for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- SEED: Sample funding opportunities
-- ────────────────────────────────────────────────────────────
insert into public.funding_opportunities (name, funder, type, description, eligibility, closing_date, official_url, last_verified, max_income)
values
  ('NSFAS Bursary', 'National Student Financial Aid Scheme', 'nsfas',
   'Government bursary covering tuition, accommodation, and living expenses for qualifying students at public universities and TVET colleges.',
   'South African citizen, household income under R350,000/year, first-time entering higher education',
   '2025-11-30', 'https://www.nsfas.org.za', '2025-01-15', 350000),

  ('Funza Lushaka Bursary', 'Department of Basic Education', 'bursary',
   'Full bursary for students studying towards a teaching qualification at an approved university.',
   'South African citizen, studying BEd or PGCE, commit to teaching in a public school after graduation',
   '2025-09-30', 'https://www.funzalushaka.doe.gov.za', '2025-01-15', null),

  ('Allan Gray Orbis Foundation Fellowship', 'Allan Gray Orbis Foundation', 'scholarship',
   'For entrepreneurial students at South African universities. Covers tuition and offers mentorship.',
   'SA citizen, exceptional academic results, entrepreneurial mindset, under 25',
   '2025-07-31', 'https://www.allangrayorbis.org', '2025-01-15', null),

  ('Thuthuka Bursary Fund', 'South African Institute of Chartered Accountants', 'bursary',
   'Bursary for African and Coloured students studying towards a CA(SA) qualification.',
   'African or Coloured South African citizen, studying BAcc or BCom Accounting, strong Maths results',
   '2025-08-31', 'https://www.saica.co.za/thuthuka', '2025-01-15', 600000),

  ('Sasol Bursary', 'Sasol', 'bursary',
   'Engineering and science bursary for students at South African universities.',
   'South African citizen, studying Engineering or Science, Maths 70%+ and Physical Science 70%+',
   '2025-08-15', 'https://www.sasol.com/bursaries', '2025-01-15', null);

-- ────────────────────────────────────────────────────────────
-- SEED: Support resources
-- ────────────────────────────────────────────────────────────
insert into public.support_resources (category, title, description, phone, website_url, province)
values
  ('crisis', 'South African Depression and Anxiety Group (SADAG)', 'Free 24/7 mental health crisis line', '0800 456 789', 'https://www.sadag.org', null),
  ('crisis', 'Suicide Crisis Line', '24-hour crisis intervention', '0800 567 567', 'https://www.sadag.org', null),
  ('general', 'NSFAS Student Support', 'Assistance with NSFAS applications and queries', '08000 67327', 'https://www.nsfas.org.za', null),
  ('counselling', 'Universities South Africa Student Wellness', 'Links to wellness services at all SA universities', null, 'https://www.usaf.ac.za', null),
  ('disability', 'Disabled People South Africa', 'Support and referrals for students with disabilities', null, 'https://www.dpsa.org.za', null);
