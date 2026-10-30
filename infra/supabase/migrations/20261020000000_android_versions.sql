-- Selectable Android versions per plan; the chosen version is stored on the device
-- and the agent picks the matching Redroid image (REDROID_IMAGES).

alter table public.plans
  add column android_versions text[] not null default '{13}'
  check (cardinality(android_versions) >= 1);

alter table public.devices
  add constraint devices_android_version_format check (android_version ~ '^[0-9]{1,2}$');

drop function if exists public.allocate_device(uuid, text, text);

create or replace function public.allocate_device(p_user uuid, p_region text, p_name text, p_android text default '13')
returns public.devices
language plpgsql security definer set search_path = public as $$
declare
  v_sub record;
  v_count integer;
  v_host public.hosts;
  v_used integer;
  v_dev public.devices;
begin
  perform pg_advisory_xact_lock(hashtext('alloc:' || p_user::text));

  select s.id, s.current_period_end, p.id as plan_id, p.max_devices, p.cpu, p.ram_mb, p.storage_gb, p.android_versions
    into v_sub
    from public.subscriptions s join public.plans p on p.id = s.plan_id
   where s.user_id = p_user and s.status = 'active' and s.current_period_end > now()
   order by s.current_period_end desc
   limit 1;
  if not found then raise exception 'NO_ACTIVE_SUBSCRIPTION'; end if;

  if not (p_android = any (v_sub.android_versions)) then raise exception 'ANDROID_VERSION_UNAVAILABLE'; end if;

  select count(*) into v_count from public.devices where user_id = p_user and status <> 'deleted';
  if v_count >= v_sub.max_devices then raise exception 'DEVICE_LIMIT_REACHED'; end if;

  select h.* into v_host
    from public.hosts h
    left join lateral (
      select count(*)::integer as used from public.devices d
       where d.host_id = h.id and d.status <> 'deleted'
    ) u on true
   where h.status = 'online'
     and h.region = p_region
     and h.last_heartbeat > now() - interval '2 minutes'
     and u.used < h.capacity
   order by u.used::float / h.capacity asc,
            coalesce((h.metrics->>'cpu_percent')::float, 0) asc
   limit 1
   for update of h;
  if not found then raise exception 'NO_CAPACITY'; end if;

  -- re-check after acquiring the host row lock (concurrent allocations)
  select count(*) into v_used from public.devices where host_id = v_host.id and status <> 'deleted';
  if v_used >= v_host.capacity then raise exception 'NO_CAPACITY'; end if;

  insert into public.devices (user_id, host_id, plan_id, name, status, cpu, ram_mb, storage_gb, android_version, expires_at)
  values (p_user, v_host.id, v_sub.plan_id, coalesce(nullif(trim(p_name), ''), 'My Android'),
          'creating', v_sub.cpu, v_sub.ram_mb, v_sub.storage_gb, p_android, v_sub.current_period_end)
  returning * into v_dev;

  return v_dev;
end $$;

revoke all on function public.allocate_device(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.allocate_device(uuid, text, text, text) to service_role;
