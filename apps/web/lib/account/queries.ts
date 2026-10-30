import "server-only";
import type { MessageRow, OrderRow, PlanRow, SubscriptionRow, WalletTopupRow, WalletTransactionRow } from "../db-types";
import { createClient } from "../supabase/server";

/** Current user's subscriptions, newest first (RLS-scoped). */
export async function getMySubscriptions(): Promise<(SubscriptionRow & { plans: PlanRow })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*, plans(*)")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as (SubscriptionRow & { plans: PlanRow })[];
}

export async function getMyOrders(): Promise<OrderRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, plans(name, slug)")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as OrderRow[];
}

export async function getMyMessages(): Promise<MessageRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as MessageRow[];
}

export async function getUnreadMessageCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).is("read_at", null);
  return count ?? 0;
}

/** Current user's wallet balance (0 when no wallet row exists yet). */
export async function getMyWalletBalance(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("wallets").select("balance").maybeSingle();
  return Number((data as { balance: number } | null)?.balance ?? 0);
}

export async function getMyWalletTransactions(): Promise<WalletTransactionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as WalletTransactionRow[];
}

export async function getMyTopups(): Promise<WalletTopupRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("wallet_topups").select("*").order("created_at", { ascending: false }).limit(20);
  return (data ?? []) as WalletTopupRow[];
}
