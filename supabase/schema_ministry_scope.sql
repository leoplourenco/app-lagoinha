-- App Lagoinha — escopo por ministério
-- Rode no SQL Editor do Supabase DEPOIS do schema.sql
-- Garante: líder/voluntário só vê o(s) ministério(s) em que está;
-- admin continua vendo tudo.

create or replace function public.my_ministry_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select ministry_id
  from public.ministry_members
  where user_id = auth.uid();
$$;

create or replace function public.my_leader_ministry_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select ministry_id
  from public.ministry_members
  where user_id = auth.uid() and role = 'leader';
$$;

-- Ministérios: admin vê todos; demais só os que participam
drop policy if exists ministries_select on public.ministries;
create policy ministries_select on public.ministries for select to authenticated
  using (
    public.is_admin()
    or id in (select public.my_ministry_ids())
  );

-- Membros: admin vê todos; pessoa vê a própria linha; membros veem colegas do mesmo ministério
drop policy if exists ministry_members_select on public.ministry_members;
create policy ministry_members_select on public.ministry_members for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or ministry_id in (select public.my_ministry_ids())
  );

-- Escala: admin vê tudo; líder vê só dos ministérios que lidera; voluntário vê a própria
drop policy if exists schedule_slots_select on public.schedule_slots;
create policy schedule_slots_select on public.schedule_slots for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or ministry_id in (select public.my_leader_ministry_ids())
  );
