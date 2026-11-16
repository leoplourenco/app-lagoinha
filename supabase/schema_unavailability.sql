-- App Lagoinha — datas em que o voluntário não está disponível
-- Rode no SQL Editor do Supabase

create table if not exists public.volunteer_unavailability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  unavailable_on date not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, unavailable_on)
);

create index if not exists volunteer_unavailability_user_idx
  on public.volunteer_unavailability (user_id);

create index if not exists volunteer_unavailability_date_idx
  on public.volunteer_unavailability (unavailable_on);

alter table public.volunteer_unavailability enable row level security;

drop policy if exists unavail_select on public.volunteer_unavailability;
create policy unavail_select on public.volunteer_unavailability
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_leader_any()
  );

drop policy if exists unavail_insert on public.volunteer_unavailability;
create policy unavail_insert on public.volunteer_unavailability
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists unavail_update on public.volunteer_unavailability;
create policy unavail_update on public.volunteer_unavailability
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists unavail_delete on public.volunteer_unavailability;
create policy unavail_delete on public.volunteer_unavailability
  for delete to authenticated
  using (user_id = auth.uid());
