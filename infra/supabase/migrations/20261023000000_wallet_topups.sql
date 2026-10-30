-- Wallet top-ups: the user creates a pending top-up (amount + bonus + payment method);
-- it's credited once paid — today an admin marks it paid, later a payment provider's webhook.

create table public.wallet_topups (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('TP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  bonus numeric(12,2) not null default 0 check (bonus >= 0),
  method text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'canceled', 'failed')),
  provider_ref text,
  handled_by uuid references public.profiles (id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index wallet_topups_user_idx on public.wallet_topups (user_id, created_at desc);
create index wallet_topups_pending_idx on public.wallet_topups (created_at) where status = 'pending';

alter table public.wallet_topups enable row level security;
create policy "wallet_topups: read own" on public.wallet_topups
  for select to authenticated using (user_id = (select auth.uid()));

-- Mark a pending top-up as paid and credit amount + bonus to the wallet (idempotent per top-up).
create or replace function public.wallet_topup_complete(p_topup uuid, p_by uuid, p_provider_ref text default null)
returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_t public.wallet_topups;
begin
  select * into v_t from public.wallet_topups where id = p_topup for update;
  if not found then raise exception 'TOPUP_NOT_FOUND'; end if;
  if v_t.status <> 'pending' then raise exception 'TOPUP_NOT_PENDING'; end if;

  update public.wallet_topups
     set status = 'paid', paid_at = now(), handled_by = p_by, provider_ref = coalesce(p_provider_ref, provider_ref)
   where id = v_t.id;

  return public.wallet_adjust(v_t.user_id, v_t.amount + v_t.bonus, 'topup',
                              'Top-up ' || v_t.reference || ' · ' || v_t.method, p_by);
end $$;

revoke all on function public.wallet_topup_complete(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.wallet_topup_complete(uuid, uuid, text) to service_role;
