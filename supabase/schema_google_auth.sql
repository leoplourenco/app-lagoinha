-- Ajuste do trigger para login Google (nome vem em "name" ou "full_name")
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
