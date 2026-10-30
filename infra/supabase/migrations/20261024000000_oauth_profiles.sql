-- OAuth sign-ups (Google): take the profile name from the provider's metadata.
-- Email sign-up sends display_name; Google sends full_name / name.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    )), '')
  );
  return new;
end $$;
