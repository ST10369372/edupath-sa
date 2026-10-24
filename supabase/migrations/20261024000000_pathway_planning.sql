create table if not exists public.saved_pathways (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  pathway_key      text not null,
  pathway          jsonb not null,
  profile_snapshot jsonb not null,
  created_at       timestamptz default now(),
  unique (user_id, pathway_key)
);

alter table public.saved_pathways enable row level security;
drop policy if exists "Students manage own saved pathways" on public.saved_pathways;
create policy "Students manage own saved pathways"
  on public.saved_pathways for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.pathway_tasks (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  saved_pathway_id  uuid references public.saved_pathways(id) on delete set null,
  title             text not null,
  completed         boolean default false,
  created_at        timestamptz default now(),
  unique (user_id, title)
);

alter table public.pathway_tasks enable row level security;
drop policy if exists "Students manage own pathway tasks" on public.pathway_tasks;
create policy "Students manage own pathway tasks"
  on public.pathway_tasks for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      saved_pathway_id is null
      or exists (
        select 1 from public.saved_pathways
        where id = saved_pathway_id and user_id = auth.uid()
      )
    )
  );
