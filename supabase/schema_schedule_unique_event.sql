-- App Lagoinha — 1 pessoa = 1 culto (não colide entre ministérios)
-- Rode no SQL Editor do Supabase

-- Remove unique antigo (event + ministry + user)
alter table public.schedule_slots
  drop constraint if exists schedule_slots_event_id_ministry_id_user_id_key;

-- Garante no máximo uma escala por pessoa por culto
alter table public.schedule_slots
  drop constraint if exists schedule_slots_event_user_unique;

alter table public.schedule_slots
  add constraint schedule_slots_event_user_unique unique (event_id, user_id);

-- Líderes veem escalas de outros ministérios só para evitar colisão
drop policy if exists schedule_slots_select on public.schedule_slots;
create policy schedule_slots_select on public.schedule_slots for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or ministry_id in (select public.my_leader_ministry_ids())
    or public.is_leader_any()
  );
