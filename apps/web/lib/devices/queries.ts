import "server-only";
import { createClient } from "../supabase/server";
import { adminClient } from "../supabase/admin";
import type { DeviceRow, HostRow, PlanRow, SubscriptionRow } from "../db-types";

/** Current user's devices (RLS-scoped). */
export async function getMyDevices(): Promise<DeviceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("devices").select("*").order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as DeviceRow[];
}

/** One of the current user's devices, or null if not theirs (RLS-scoped). */
export async function getMyDevice(id: string): Promise<DeviceRow | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("devices").select("*").eq("id", id).maybeSingle();
  return (data as DeviceRow | null) ?? null;
}

export async function getActiveSubscription(): Promise<(SubscriptionRow & { plans: PlanRow }) | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*, plans(*)")
    .eq("status", "active")
    .gt("current_period_end", new Date().toISOString())
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as (SubscriptionRow & { plans: PlanRow }) | null) ?? null;
}

export async function getAvailableRegions(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("available_regions");
  return ((data ?? []) as { region: string }[]).map((r) => r.region);
}

export async function getPlans(): Promise<PlanRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("*").eq("is_active", true).order("sort_order");
  return (data ?? []) as PlanRow[];
}

/** Host lookup uses the service role: hosts are not readable by users. */
export async function getHost(hostId: string): Promise<HostRow> {
  const { data, error } = await adminClient().from("hosts").select("*").eq("id", hostId).single();
  if (error || !data) throw new Error("Host not found");
  return data as HostRow;
}
