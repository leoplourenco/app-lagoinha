-- App Lagoinha — porta vê toda a escala do culto + equipe Sala dá baixa
-- Rode no SQL Editor do Supabase

-- Membros da Sala leem a escala completa (lista da porta)
drop policy if exists schedule_slots_select on public.schedule_slots;
create policy schedule_slots_select on public.schedule_slots for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or ministry_id in (select public.my_leader_ministry_ids())
    or public.is_leader_any()
    or public.is_ministry_member(public.ministry_id_by_slug('sala'))
  );

-- Equipe da Sala (não só líder) pode dar baixa na porta
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
