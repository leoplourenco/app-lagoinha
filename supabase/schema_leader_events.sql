-- App Lagoinha — líderes podem criar cultos/eventos para montar escala
-- Rode no SQL Editor do Supabase (depois do schema + ministry_scope)

drop policy if exists service_events_leader_insert on public.service_events;
create policy service_events_leader_insert on public.service_events
  for insert to authenticated
  with check (public.is_leader_any() or public.is_admin());
