-- App Lagoinha V1 — schema + RLS + seed
-- Fuso: America/Sao_Paulo (tratar "hoje"/cultos no app)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  is_admin boolean not null default false,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ministries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ministry_members (
  id uuid primary key default gen_random_uuid(),
  ministry_id uuid not null references public.ministries (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  role text not null check (role in ('volunteer', 'leader')),
  created_at timestamptz not null default now(),
  unique (ministry_id, user_id)
);

create table if not exists public.service_events (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  title text not null,
  created_at timestamptz not null default now()
);

create index if not exists service_events_starts_at_idx on public.service_events (starts_at);

create table if not exists public.schedule_slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.service_events (id) on delete cascade,
  ministry_id uuid not null references public.ministries (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  role_label text not null default '',
  created_at timestamptz not null default now(),
  -- 1 pessoa só pode estar em 1 ministério por culto
  unique (event_id, user_id)
);

create table if not exists public.church_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  event_id uuid not null references public.service_events (id) on delete cascade,
  checked_at timestamptz not null default now(),
  method text not null check (method in ('qr', 'manual')),
  created_by uuid references public.profiles (user_id),
  unique (user_id, event_id)
);

create table if not exists public.church_qr_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null default 'Check-in igreja',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sala_attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.service_events (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'liberated')),
  arrived_at timestamptz,
  liberated_by uuid references public.profiles (user_id),
  unique (event_id, user_id)
);

create table if not exists public.kitchen_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity numeric not null default 0,
  unit text not null default 'un',
  minimum numeric not null default 0,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (user_id)
);

create table if not exists public.coffee_todos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.service_events (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_by uuid references public.profiles (user_id)
);

create table if not exists public.host_guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  guest_type text not null default 'outro' check (guest_type in ('pastor', 'cantor', 'outro')),
  arrival_at timestamptz,
  departure_at timestamptz,
  event_id uuid references public.service_events (id) on delete set null,
  contact text,
  notes text,
  status text not null default 'previsto' check (status in ('previsto', 'chegou', 'concluido', 'cancelado')),
  created_by uuid references public.profiles (user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.host_menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.host_guest_menu (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.host_guests (id) on delete cascade,
  menu_item_id uuid not null references public.host_menu_items (id) on delete cascade,
  notes text,
  unique (guest_id, menu_item_id)
);

create table if not exists public.host_dishware_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity numeric not null default 0,
  unit text not null default 'un',
  minimum numeric not null default 0,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (user_id)
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where user_id = auth.uid()),
    false
  );
$$;

create or replace function public.is_ministry_member(p_ministry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ministry_members
    where ministry_id = p_ministry_id and user_id = auth.uid()
  ) or public.is_admin();
$$;

create or replace function public.is_ministry_leader(p_ministry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ministry_members
    where ministry_id = p_ministry_id and user_id = auth.uid() and role = 'leader'
  ) or public.is_admin();
$$;

create or replace function public.is_leader_any()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ministry_members
    where user_id = auth.uid() and role = 'leader'
  ) or public.is_admin();
$$;

create or replace function public.ministry_id_by_slug(p_slug text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.ministries where slug = p_slug limit 1;
$$;

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_email text;
  v_provider text;
begin
  v_email := lower(coalesce(new.email, ''));
  v_provider := coalesce(new.raw_app_meta_data->>'provider', 'email');
  v_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    split_part(v_email, '@', 1)
  );

  insert into public.profiles (user_id, full_name, email, is_admin, privacy_accepted_at)
  values (
    new.id,
    v_name,
    v_email,
    v_email = 'leopoldo.lourenco@outlook.com',
    case
      when coalesce(new.raw_user_meta_data->>'privacy_accepted', 'false') = 'true'
        then now()
      when v_provider = 'google'
        then now()
      else null
    end
  )
  on conflict (user_id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        privacy_accepted_at = coalesce(public.profiles.privacy_accepted_at, excluded.privacy_accepted_at),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.ministries enable row level security;
alter table public.ministry_members enable row level security;
alter table public.service_events enable row level security;
alter table public.schedule_slots enable row level security;
alter table public.church_checkins enable row level security;
alter table public.church_qr_codes enable row level security;
alter table public.sala_attendance enable row level security;
alter table public.kitchen_items enable row level security;
alter table public.coffee_todos enable row level security;
alter table public.host_guests enable row level security;
alter table public.host_menu_items enable row level security;
alter table public.host_guest_menu enable row level security;
alter table public.host_dishware_items enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ministries (admin vê todos; demais só os que participam)
drop policy if exists ministries_select on public.ministries;
create policy ministries_select on public.ministries for select to authenticated
  using (
    public.is_admin()
    or id in (select public.my_ministry_ids())
  );

drop policy if exists ministries_admin on public.ministries;
create policy ministries_admin on public.ministries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ministry_members (admin / própria linha / colegas do mesmo ministério)
drop policy if exists ministry_members_select on public.ministry_members;
create policy ministry_members_select on public.ministry_members for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or ministry_id in (select public.my_ministry_ids())
  );

drop policy if exists ministry_members_manage on public.ministry_members;
create policy ministry_members_manage on public.ministry_members for all to authenticated
  using (public.is_ministry_leader(ministry_id) or public.is_admin())
  with check (public.is_ministry_leader(ministry_id) or public.is_admin());

-- service_events
drop policy if exists service_events_select on public.service_events;
create policy service_events_select on public.service_events for select to authenticated
  using (true);

drop policy if exists service_events_admin on public.service_events;
create policy service_events_admin on public.service_events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Líderes criam culto/evento ao montar escala (padrão ou especial)
drop policy if exists service_events_leader_insert on public.service_events;
create policy service_events_leader_insert on public.service_events
  for insert to authenticated
  with check (public.is_leader_any() or public.is_admin());

-- schedule_slots (admin / pr�pria / l�deres / Sala v� tudo p/ porta)
drop policy if exists schedule_slots_select on public.schedule_slots;
create policy schedule_slots_select on public.schedule_slots for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or ministry_id in (select public.my_leader_ministry_ids())
    or public.is_leader_any()
    or public.is_ministry_member(public.ministry_id_by_slug('sala'))
  );

drop policy if exists schedule_slots_manage on public.schedule_slots;
create policy schedule_slots_manage on public.schedule_slots for all to authenticated
  using (public.is_ministry_leader(ministry_id) or public.is_admin())
  with check (public.is_ministry_leader(ministry_id) or public.is_admin());

-- church_checkins
drop policy if exists church_checkins_select on public.church_checkins;
create policy church_checkins_select on public.church_checkins for select to authenticated
  using (user_id = auth.uid() or public.is_leader_any() or public.is_admin());

drop policy if exists church_checkins_insert_self on public.church_checkins;
create policy church_checkins_insert_self on public.church_checkins for insert to authenticated
  with check (user_id = auth.uid() or public.is_leader_any() or public.is_admin());

-- church_qr_codes
drop policy if exists church_qr_select on public.church_qr_codes;
create policy church_qr_select on public.church_qr_codes for select to authenticated
  using (active = true or public.is_admin());

drop policy if exists church_qr_admin on public.church_qr_codes;
create policy church_qr_admin on public.church_qr_codes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- sala_attendance
drop policy if exists sala_attendance_select on public.sala_attendance;
create policy sala_attendance_select on public.sala_attendance for select to authenticated
  using (
    public.is_ministry_member(public.ministry_id_by_slug('sala'))
    or public.is_admin()
  );

drop policy if exists sala_attendance_manage on public.sala_attendance;
create policy sala_attendance_manage on public.sala_attendance for all to authenticated
  using (
    public.is_ministry_member(public.ministry_id_by_slug('sala'))
    or public.is_admin()
  )
  with check (
    public.is_ministry_member(public.ministry_id_by_slug('sala'))
    or public.is_admin()
  );

-- kitchen
drop policy if exists kitchen_select on public.kitchen_items;
create policy kitchen_select on public.kitchen_items for select to authenticated
  using (public.is_ministry_member(public.ministry_id_by_slug('sala')) or public.is_admin());

drop policy if exists kitchen_manage on public.kitchen_items;
create policy kitchen_manage on public.kitchen_items for all to authenticated
  using (public.is_ministry_member(public.ministry_id_by_slug('sala')) or public.is_admin())
  with check (public.is_ministry_member(public.ministry_id_by_slug('sala')) or public.is_admin());

-- coffee
drop policy if exists coffee_select on public.coffee_todos;
create policy coffee_select on public.coffee_todos for select to authenticated
  using (public.is_ministry_member(public.ministry_id_by_slug('sala')) or public.is_admin());

drop policy if exists coffee_manage on public.coffee_todos;
create policy coffee_manage on public.coffee_todos for all to authenticated
  using (public.is_ministry_member(public.ministry_id_by_slug('sala')) or public.is_admin())
  with check (public.is_ministry_member(public.ministry_id_by_slug('sala')) or public.is_admin());

-- host guests
drop policy if exists host_guests_select on public.host_guests;
create policy host_guests_select on public.host_guests for select to authenticated
  using (public.is_ministry_member(public.ministry_id_by_slug('host')) or public.is_admin());

drop policy if exists host_guests_insert on public.host_guests;
create policy host_guests_insert on public.host_guests for insert to authenticated
  with check (
    public.is_ministry_leader(public.ministry_id_by_slug('host')) or public.is_admin()
  );

drop policy if exists host_guests_update on public.host_guests;
create policy host_guests_update on public.host_guests for update to authenticated
  using (public.is_ministry_member(public.ministry_id_by_slug('host')) or public.is_admin())
  with check (public.is_ministry_member(public.ministry_id_by_slug('host')) or public.is_admin());

drop policy if exists host_guests_delete on public.host_guests;
create policy host_guests_delete on public.host_guests for delete to authenticated
  using (public.is_ministry_leader(public.ministry_id_by_slug('host')) or public.is_admin());

-- host menu
drop policy if exists host_menu_select on public.host_menu_items;
create policy host_menu_select on public.host_menu_items for select to authenticated
  using (public.is_ministry_member(public.ministry_id_by_slug('host')) or public.is_admin());

drop policy if exists host_menu_manage on public.host_menu_items;
create policy host_menu_manage on public.host_menu_items for all to authenticated
  using (public.is_ministry_leader(public.ministry_id_by_slug('host')) or public.is_admin())
  with check (public.is_ministry_leader(public.ministry_id_by_slug('host')) or public.is_admin());

drop policy if exists host_guest_menu_select on public.host_guest_menu;
create policy host_guest_menu_select on public.host_guest_menu for select to authenticated
  using (public.is_ministry_member(public.ministry_id_by_slug('host')) or public.is_admin());

drop policy if exists host_guest_menu_manage on public.host_guest_menu;
create policy host_guest_menu_manage on public.host_guest_menu for all to authenticated
  using (public.is_ministry_leader(public.ministry_id_by_slug('host')) or public.is_admin())
  with check (public.is_ministry_leader(public.ministry_id_by_slug('host')) or public.is_admin());

-- dishware
drop policy if exists dishware_select on public.host_dishware_items;
create policy dishware_select on public.host_dishware_items for select to authenticated
  using (public.is_ministry_member(public.ministry_id_by_slug('host')) or public.is_admin());

drop policy if exists dishware_manage on public.host_dishware_items;
create policy dishware_manage on public.host_dishware_items for all to authenticated
  using (public.is_ministry_member(public.ministry_id_by_slug('host')) or public.is_admin())
  with check (public.is_ministry_member(public.ministry_id_by_slug('host')) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------

insert into public.ministries (name, slug, active)
values
  ('Sala de Voluntarios', 'sala', true),
  ('Host', 'host', true),
  ('Diaconato', 'diaconato', true),
  ('Midia Follow', 'midia', true),
  ('Intercessao', 'intercessao', true),
  ('Producao', 'producao', true),
  ('Estacionamento - Centurioes', 'estacionamento', true)
on conflict (slug) do nothing;

insert into public.church_qr_codes (code, label, active)
values ('lagoinha-checkin-v1', 'Check-in igreja — App Lagoinha', true)
on conflict (code) do nothing;

-- Cultos exemplo: próximo domingo manhã e noite (America/Sao_Paulo)
insert into public.service_events (starts_at, title)
select * from (
  values
    (
      (date_trunc('week', (now() at time zone 'America/Sao_Paulo')) + interval '6 days' + interval '9 hours')
        at time zone 'America/Sao_Paulo',
      'Domingo manhã'
    ),
    (
      (date_trunc('week', (now() at time zone 'America/Sao_Paulo')) + interval '6 days' + interval '18 hours')
        at time zone 'America/Sao_Paulo',
      'Domingo noite'
    )
) as v(starts_at, title)
where not exists (select 1 from public.service_events limit 1);

insert into public.kitchen_items (name, quantity, unit, minimum)
select * from (
  values
    ('Café em pó', 2::numeric, 'kg', 1::numeric),
    ('Leite', 10::numeric, 'L', 4::numeric),
    ('Açúcar', 3::numeric, 'kg', 1::numeric),
    ('Copos descartáveis', 200::numeric, 'un', 50::numeric)
) as v(name, quantity, unit, minimum)
where not exists (select 1 from public.kitchen_items limit 1);

insert into public.host_menu_items (name, description, active)
select * from (
  values
    ('Água', 'Garrafa / jarra', true),
    ('Café', 'Café passado', true),
    ('Suco', 'Natural ou caixa', true),
    ('Lanche leve', 'Pão / fruta', true)
) as v(name, description, active)
where not exists (select 1 from public.host_menu_items limit 1);

insert into public.host_dishware_items (name, quantity, unit, minimum)
select * from (
  values
    ('Pratos', 24::numeric, 'un', 12::numeric),
    ('Xícaras', 24::numeric, 'un', 12::numeric),
    ('Talheres (jogo)', 24::numeric, 'un', 12::numeric),
    ('Travessas', 6::numeric, 'un', 2::numeric)
) as v(name, quantity, unit, minimum)
where not exists (select 1 from public.host_dishware_items limit 1);

insert into public.coffee_todos (event_id, title, done, sort_order)
select se.id, t.title, false, t.sort_order
from public.service_events se
cross join (
  values
    ('Preparar café', 1),
    ('Montar mesa', 2),
    ('Repor água', 3)
) as t(title, sort_order)
where se.title = 'Domingo manhã'
  and not exists (select 1 from public.coffee_todos limit 1);

-- ---------------------------------------------------------------------------
-- Indisponibilidade do volunt�rio
-- ---------------------------------------------------------------------------

create table if not exists public.volunteer_unavailability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  unavailable_on date not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, unavailable_on)
);

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
