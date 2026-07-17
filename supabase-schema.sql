create table if not exists public.meetings (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.meetings enable row level security;

drop policy if exists "Public meeting state read" on public.meetings;
create policy "Public meeting state read"
on public.meetings
for select
to anon
using (true);

drop policy if exists "Public meeting state insert" on public.meetings;
create policy "Public meeting state insert"
on public.meetings
for insert
to anon
with check (true);

drop policy if exists "Public meeting state update" on public.meetings;
create policy "Public meeting state update"
on public.meetings
for update
to anon
using (true)
with check (true);

alter publication supabase_realtime add table public.meetings;
