-- App Lagoinha — ministérios adicionais
-- Rode no SQL Editor do Supabase

insert into public.ministries (name, slug, active)
values
  ('Diaconato', 'diaconato', true),
  ('Mídia Follow', 'midia', true),
  ('Intercessão', 'intercessao', true),
  ('Produção', 'producao', true),
  ('Estacionamento — Centuriões', 'estacionamento', true)
on conflict (slug) do update
  set name = excluded.name,
      active = true;
