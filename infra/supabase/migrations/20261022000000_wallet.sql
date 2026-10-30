-- Wallet: per-user balance + ledger. Balance is credited by admins (later: payment top-ups)
-- and spent on plans from the "new device" page. All changes go through the functions below.

alter type public.order_source add value if not exists 'wallet';

create table public.wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  balance numeric(12,2) not null default 0 check (balance >= 0),
  currency text not null default 'USD',
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12,2) not null check (amount <> 0), -- + credit, - debit
  balance_after numeric(12,2) not null,
  kind text not null check (kind in ('topup', 'purchase', 'refund', 'adjustment')),
  note text,
  order_id uuid references public.orders (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index wallet_tx_user_idx on public.wallet_transactions (user_id, created_at desc);

alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
create policy "wallets: read own" on public.wallets
  for select to authenticated using (user_id = (select auth.uid()));
create policy "wallet_transactions: read own" on public.wallet_transactions
  for select to authenticated using (user_id = (select auth.uid()));

-- Credit (amount > 0) or debit (amount < 0) a wallet outside of purchases (top-up, refund, adjustment).
create or replace function public.wallet_adjust(p_user uuid, p_amount numeric, p_kind text, p_note text, p_by uuid)
returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_balance numeric(12,2);
begin
  if p_amount = 0 then raise exception 'INVALID_AMOUNT'; end if;
  insert into public.wallets (user_id) values (p_user) on conflict (user_id) do nothing;
  select balance into v_balance from public.wallets where user_id = p_user for update;
  if v_balance + p_amount < 0 then raise exception 'INSUFFICIENT_BALANCE'; end if;

  update public.wallets set balance = balance + p_amount, updated_at = now()
   where user_id = p_user returning balance into v_balance;
  insert into public.wallet_transactions (user_id, amount, balance_after, kind, note, created_by)
  values (p_user, p_amount, v_balance, p_kind, p_note, p_by);

  if p_amount > 0 then
    insert into public.messages (user_id, kind, title, body, link)
    values (p_user, 'success', 'Wallet topped up',
            '$' || to_char(p_amount, 'FM999999990.00') || ' added. Balance: $' || to_char(v_balance, 'FM999999990.00') || '.',
            '/dashboard/wallet');
  end if;
  return v_balance;
end $$;

-- Pay for a plan rental from the wallet: debit, activate/extend the subscription, record the order.
create or replace function public.wallet_purchase(p_user uuid, p_plan uuid, p_days integer, p_amount numeric)
returns table (plan_name text, period_end timestamptz, new_balance numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_plan public.plans;
  v_sub public.subscriptions;
  v_balance numeric(12,2);
  v_end timestamptz;
  v_sub_id uuid;
  v_order uuid;
begin
  if p_days < 1 or p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  perform pg_advisory_xact_lock(hashtext('alloc:' || p_user::text)); -- same lock as allocate_device / redeem_code

  select * into v_plan from public.plans where id = p_plan and is_active;
  if not found then raise exception 'INVALID_PLAN'; end if;

  insert into public.wallets (user_id) values (p_user) on conflict (user_id) do nothing;
  select w.balance into v_balance from public.wallets w where w.user_id = p_user for update;
  if v_balance < p_amount then raise exception 'INSUFFICIENT_BALANCE'; end if;

  select * into v_sub from public.subscriptions s
   where s.user_id = p_user and s.status = 'active' and s.current_period_end > now()
   order by s.current_period_end desc limit 1;
  if found and v_sub.plan_id <> p_plan then raise exception 'PLAN_CONFLICT'; end if;

  if found then
    v_end := v_sub.current_period_end + make_interval(days => p_days);
    update public.subscriptions set current_period_end = v_end where id = v_sub.id;
    v_sub_id := v_sub.id;
  else
    v_end := now() + make_interval(days => p_days);
    insert into public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
    values (p_user, p_plan, 'active', now(), v_end)
    returning id into v_sub_id;
  end if;
  update public.devices set expires_at = v_end where user_id = p_user and status <> 'deleted';

  insert into public.orders (user_id, plan_id, kind, source, status, days, amount, currency, subscription_id)
  values (p_user, p_plan, case when v_sub.id is null then 'new' else 'renew' end, 'wallet', 'paid',
          p_days, p_amount, v_plan.currency, v_sub_id)
  returning id into v_order;

  update public.wallets w set balance = w.balance - p_amount, updated_at = now()
   where w.user_id = p_user returning w.balance into v_balance;
  insert into public.wallet_transactions (user_id, amount, balance_after, kind, note, order_id)
  values (p_user, -p_amount, v_balance, 'purchase', v_plan.name || ' · ' || p_days || ' days', v_order);

  insert into public.messages (user_id, kind, title, body, link)
  values (p_user, 'success', v_plan.name || ' purchased',
          p_days || ' day(s) paid from your wallet. Active until ' || to_char(v_end at time zone 'UTC', 'DD Mon YYYY') || ' (UTC).',
          '/dashboard/subscriptions');

  return query select v_plan.name, v_end, v_balance;
end $$;

revoke all on function public.wallet_adjust(uuid, numeric, text, text, uuid) from public, anon, authenticated;
revoke all on function public.wallet_purchase(uuid, uuid, integer, numeric) from public, anon, authenticated;
grant execute on function public.wallet_adjust(uuid, numeric, text, text, uuid) to service_role;
grant execute on function public.wallet_purchase(uuid, uuid, integer, numeric) to service_role;
