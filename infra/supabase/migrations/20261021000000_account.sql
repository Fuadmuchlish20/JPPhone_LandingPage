-- Account features: redeem codes, order history and in-app messages.
--   redeem_codes / redeem_uses  "plan" codes activate a plan (Add new cloud phone),
--                               "renew" codes add days to the subscription (Renew cloud phone)
--   orders                      every plan activation/renewal (redeem, admin grant, later payments)
--   messages                    per-user notifications shown under Account → Messages

-- ---------------------------------------------------------------- orders
create type public.order_source as enum ('payment', 'redeem', 'admin');
create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid references public.plans (id),
  kind text not null check (kind in ('new', 'renew')),
  source public.order_source not null,
  status public.order_status not null default 'paid',
  days integer not null check (days > 0),
  amount numeric(10,2) not null default 0,
  currency text not null default 'USD',
  reference text, -- masked redeem code, payment id, …
  subscription_id uuid references public.subscriptions (id) on delete set null,
  created_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
alter table public.orders enable row level security;
create policy "orders: read own" on public.orders
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'info' check (kind in ('info', 'success', 'warning')),
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_user_idx on public.messages (user_id, created_at desc);
alter table public.messages enable row level security;
create policy "messages: read own" on public.messages
  for select to authenticated using (user_id = (select auth.uid()));
-- marking as read goes through a server action with the service role

-- ---------------------------------------------------------------- redeem codes
create type public.redeem_kind as enum ('plan', 'renew');

create table public.redeem_codes (
  code text primary key check (code ~ '^[A-Z0-9-]{6,40}$'),
  kind public.redeem_kind not null,
  plan_id uuid references public.plans (id), -- required for "plan"; optional restriction for "renew"
  days integer not null check (days between 1 and 3650),
  max_uses integer not null default 1 check (max_uses >= 1),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (kind <> 'plan' or plan_id is not null)
);

create table public.redeem_uses (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.redeem_codes (code) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  redeemed_at timestamptz not null default now(),
  unique (code, user_id)
);
create index redeem_uses_user_idx on public.redeem_uses (user_id, redeemed_at desc);

alter table public.redeem_codes enable row level security; -- no policies: service role only
alter table public.redeem_uses enable row level security;
create policy "redeem_uses: read own" on public.redeem_uses
  for select to authenticated using (user_id = (select auth.uid()));

-- Atomically validate and apply a code. Raises a stable keyword the web app maps to a message.
create or replace function public.redeem_code(p_user uuid, p_code text, p_kind public.redeem_kind)
returns table (kind public.redeem_kind, plan_name text, days integer, period_end timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_code public.redeem_codes;
  v_sub public.subscriptions;
  v_plan public.plans;
  v_end timestamptz;
  v_sub_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('alloc:' || p_user::text)); -- same lock as allocate_device

  select * into v_code from public.redeem_codes c where c.code = upper(trim(p_code)) for update;
  if not found then raise exception 'INVALID_CODE'; end if;
  if v_code.kind <> p_kind then raise exception 'WRONG_KIND'; end if;
  if v_code.expires_at is not null and v_code.expires_at < now() then raise exception 'CODE_EXPIRED'; end if;
  if v_code.used_count >= v_code.max_uses then raise exception 'CODE_USED_UP'; end if;
  if exists (select 1 from public.redeem_uses u where u.code = v_code.code and u.user_id = p_user) then
    raise exception 'ALREADY_REDEEMED';
  end if;

  if v_code.kind = 'plan' then
    select * into v_sub from public.subscriptions s
     where s.user_id = p_user and s.status = 'active' and s.current_period_end > now()
     order by s.current_period_end desc limit 1;
    if found and v_sub.plan_id <> v_code.plan_id then raise exception 'PLAN_CONFLICT'; end if;

    if found then
      v_end := v_sub.current_period_end + make_interval(days => v_code.days);
      update public.subscriptions set current_period_end = v_end where id = v_sub.id;
      v_sub_id := v_sub.id;
    else
      v_end := now() + make_interval(days => v_code.days);
      insert into public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
      values (p_user, v_code.plan_id, 'active', now(), v_end)
      returning id into v_sub_id;
    end if;
  else
    -- Renew the latest active or expired subscription; expired ones restart from now.
    select * into v_sub from public.subscriptions s
     where s.user_id = p_user and s.status in ('active', 'expired')
     order by s.current_period_end desc limit 1;
    if not found then raise exception 'NO_SUBSCRIPTION'; end if;
    if v_code.plan_id is not null and v_code.plan_id <> v_sub.plan_id then raise exception 'PLAN_MISMATCH'; end if;

    v_end := greatest(v_sub.current_period_end, now()) + make_interval(days => v_code.days);
    update public.subscriptions set current_period_end = v_end, status = 'active' where id = v_sub.id;
    v_sub_id := v_sub.id;
  end if;

  update public.devices set expires_at = v_end where user_id = p_user and status <> 'deleted';
  update public.redeem_codes set used_count = used_count + 1 where code = v_code.code;
  insert into public.redeem_uses (code, user_id, subscription_id) values (v_code.code, p_user, v_sub_id);

  select p.* into v_plan from public.plans p join public.subscriptions s on s.plan_id = p.id where s.id = v_sub_id;

  insert into public.orders (user_id, plan_id, kind, source, status, days, amount, currency, reference, subscription_id)
  values (p_user, v_plan.id, case when v_code.kind = 'plan' then 'new' else 'renew' end, 'redeem', 'paid',
          v_code.days, 0, v_plan.currency, left(v_code.code, 4) || '••••', v_sub_id);

  insert into public.messages (user_id, kind, title, body, link)
  values (p_user, 'success',
          case when v_code.kind = 'plan' then v_plan.name || ' activated' else v_plan.name || ' renewed' end,
          v_code.days || ' day(s) added with a redeem code. Active until ' || to_char(v_end at time zone 'UTC', 'DD Mon YYYY') || ' (UTC).',
          case when v_code.kind = 'plan' then '/dashboard/new' else '/dashboard/subscriptions' end);

  return query select v_code.kind, v_plan.name, v_code.days, v_end;
end $$;

revoke all on function public.redeem_code(uuid, text, public.redeem_kind) from public, anon, authenticated;
grant execute on function public.redeem_code(uuid, text, public.redeem_kind) to service_role;
