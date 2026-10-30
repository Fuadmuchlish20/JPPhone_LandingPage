-- claudeemulator.net — initial schema
-- Users only see their own rows (RLS). All writes to devices/hosts/subscriptions
-- go through the web server (service role) or the device-agent (service role).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums
create type public.device_status as enum
  ('creating', 'starting', 'running', 'stopping', 'stopped', 'error', 'deleted');
create type public.host_status as enum ('online', 'offline', 'draining', 'maintenance');
create type public.subscription_status as enum ('active', 'expired', 'canceled');

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'display_name', null));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- plans
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  cpu numeric(4,2) not null check (cpu > 0),
  ram_mb integer not null check (ram_mb >= 1024),
  storage_gb integer not null check (storage_gb >= 4),
  max_devices integer not null check (max_devices >= 1),
  price numeric(10,2) not null default 0,
  currency text not null default 'USD',
  period_days integer not null default 30,
  idle_stop_minutes integer, -- null = keep running 24/7
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  status public.subscription_status not null default 'active',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  created_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id, status);

-- ---------------------------------------------------------------- hosts
create table public.hosts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  region text not null,
  public_url text not null,           -- https://host1.claudeemulator.net
  capacity integer not null check (capacity > 0),  -- max devices
  status public.host_status not null default 'offline',
  last_heartbeat timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- devices
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  host_id uuid not null references public.hosts (id),
  plan_id uuid not null references public.plans (id),
  name text not null default 'My Android',
  container_id text,
  status public.device_status not null default 'creating',
  status_message text,
  android_version text not null default '13',
  cpu numeric(4,2) not null,
  ram_mb integer not null,
  storage_gb integer not null,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index devices_user_idx on public.devices (user_id) where status <> 'deleted';
create index devices_host_idx on public.devices (host_id) where status <> 'deleted';

-- ---------------------------------------------------------------- device_sessions (audit)
create table public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  host_id uuid references public.hosts (id),
  event text not null,                -- stream_start | stream_end | action:<name> | apk_install
  ip text,
  user_agent text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index device_sessions_device_idx on public.device_sessions (device_id, created_at desc);

-- ---------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.hosts enable row level security;
alter table public.devices enable row level security;
alter table public.device_sessions enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- users may only change display_name (never is_admin/email)
revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;

create policy "plans: public read" on public.plans
  for select to anon, authenticated using (is_active);

create policy "subscriptions: read own" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

-- hosts: no user policies (deny all). Exposed via server only.

create policy "devices: read own" on public.devices
  for select to authenticated using (user_id = (select auth.uid()) and status <> 'deleted');

create policy "device_sessions: read own" on public.device_sessions
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- allocation (service role only)
-- Atomically: verify active subscription + device limit, pick least-loaded online
-- host in region with free capacity, insert the device row.
create or replace function public.allocate_device(p_user uuid, p_region text, p_name text)
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

  select s.id, s.current_period_end, p.id as plan_id, p.max_devices, p.cpu, p.ram_mb, p.storage_gb
    into v_sub
    from public.subscriptions s join public.plans p on p.id = s.plan_id
   where s.user_id = p_user and s.status = 'active' and s.current_period_end > now()
   order by s.current_period_end desc
   limit 1;
  if not found then raise exception 'NO_ACTIVE_SUBSCRIPTION'; end if;

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

  insert into public.devices (user_id, host_id, plan_id, name, status, cpu, ram_mb, storage_gb, expires_at)
  values (p_user, v_host.id, v_sub.plan_id, coalesce(nullif(trim(p_name), ''), 'My Android'),
          'creating', v_sub.cpu, v_sub.ram_mb, v_sub.storage_gb, v_sub.current_period_end)
  returning * into v_dev;

  return v_dev;
end $$;

revoke all on function public.allocate_device(uuid, text, text) from public, anon, authenticated;
grant execute on function public.allocate_device(uuid, text, text) to service_role;

-- Regions that currently have an online host (for the create-device form).
create or replace function public.available_regions()
returns table (region text)
language sql security definer set search_path = public stable as $$
  select distinct h.region from public.hosts h
   where h.status = 'online' and h.last_heartbeat > now() - interval '2 minutes'
   order by 1;
$$;
grant execute on function public.available_regions() to authenticated;
