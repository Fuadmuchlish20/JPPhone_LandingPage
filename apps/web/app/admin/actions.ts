"use server";

import { randomInt } from "node:crypto";
import { refresh } from "next/cache";
import type { DeviceAction, HostStatus } from "@ce/shared/types";
import type { ActionState } from "@/components/ui/action-button";
import { notify } from "@/lib/account/notify";
import { agent } from "@/lib/agent/client";
import { requireAdmin } from "@/lib/auth";
import type { DeviceRow, HostRow, PlanRow, RedeemKind } from "@/lib/db-types";
import { removeDevice, runDeviceAction } from "@/lib/devices/service";
import { formatDate } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";

const HOST_STATUSES: HostStatus[] = ["online", "offline", "draining", "maintenance"];

async function deviceById(id: string): Promise<DeviceRow | null> {
  const { data } = await adminClient().from("devices").select("*").eq("id", id).maybeSingle();
  return (data as DeviceRow | null) ?? null;
}

export async function addHostAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  const region = String(fd.get("region") ?? "").trim().toLowerCase();
  const publicUrl = String(fd.get("public_url") ?? "").trim().replace(/\/$/, "");
  const capacity = Number(fd.get("capacity"));
  if (!name || !region || !/^https?:\/\//.test(publicUrl) || !(capacity > 0)) {
    return { error: "Fill name, region, a valid URL and capacity." };
  }
  const { error } = await adminClient()
    .from("hosts")
    .insert({ name, region, public_url: publicUrl, capacity, status: "offline" });
  refresh();
  return error ? { error: error.message } : { ok: true };
}

export async function setHostStatusAction(
  hostId: string,
  status: HostStatus,
  _prev: ActionState,
  _fd: FormData,
): Promise<ActionState> {
  await requireAdmin();
  if (!HOST_STATUSES.includes(status)) return { error: "Invalid status." };
  const { error } = await adminClient().from("hosts").update({ status }).eq("id", hostId);
  refresh();
  return error ? { error: error.message } : { ok: true };
}

export async function checkHostAction(hostId: string, _prev: ActionState, _fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const { data } = await adminClient().from("hosts").select("*").eq("id", hostId).single();
  if (!data) return { error: "Host not found." };
  try {
    const h = await agent.health(data as HostRow);
    return { ok: true, message: `OK · ${h.running_containers} running · CPU ${h.cpu_percent}%` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function adminDeviceAction(
  deviceId: string,
  action: DeviceAction | "delete",
  _prev: ActionState,
  _fd: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const device = await deviceById(deviceId);
  if (!device) return { error: "Device not found." };
  const res = action === "delete" ? await removeDevice(device, admin.id) : await runDeviceAction(device, admin.id, action);
  refresh();
  return res.error ? { error: res.error } : { ok: true };
}

/** Grant (or extend) a plan for a user — the hook point for a payment provider later. */
export async function grantPlanAction(userId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const db = adminClient();
  const planId = String(fd.get("plan_id") ?? "");
  const { data: plan } = await db.from("plans").select("*").eq("id", planId).single();
  if (!plan) return { error: "Choose a plan." };
  const p = plan as PlanRow;

  const now = new Date();
  const end = new Date(now.getTime() + p.period_days * 86_400_000);
  await db.from("subscriptions").update({ status: "canceled" }).eq("user_id", userId).eq("status", "active");
  const { data: sub, error } = await db
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan_id: p.id,
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await db.from("orders").insert({
    user_id: userId,
    plan_id: p.id,
    kind: "new",
    source: "admin",
    status: "paid",
    days: p.period_days,
    amount: 0,
    currency: p.currency,
    subscription_id: sub?.id ?? null,
  });
  await notify(userId, {
    kind: "success",
    title: `${p.name} activated`,
    body: `Your ${p.name} plan is active until ${formatDate(end.toISOString())}.`,
    link: "/subscriptions",
  });
  await db.from("devices").update({ expires_at: end.toISOString() }).eq("user_id", userId).neq("status", "deleted");
  refresh();
  return { ok: true };
}

export async function setAdminAction(userId: string, makeAdmin: boolean, _prev: ActionState, _fd: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  if (me.id === userId && !makeAdmin) return { error: "You can't remove your own admin role." };
  const { error } = await adminClient().from("profiles").update({ is_admin: makeAdmin }).eq("id", userId);
  refresh();
  return error ? { error: error.message } : { ok: true };
}

// No 0/O/1/I/L so codes can be read out loud and typed without mistakes.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function newCode(): string {
  const chars = Array.from({ length: 16 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]);
  return [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join("")).join("-");
}

/** Generates redeem codes; returns them newline-separated in `message` so the admin can copy them. */
export async function generateCodesAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const kind = String(fd.get("kind")) as RedeemKind;
  const planId = String(fd.get("plan_id") ?? "") || null;
  const days = Number(fd.get("days"));
  const quantity = Number(fd.get("quantity"));
  const maxUses = Number(fd.get("max_uses") || 1);
  const expires = String(fd.get("expires_at") ?? "");
  const note = String(fd.get("note") ?? "").slice(0, 200) || null;

  if (kind !== "plan" && kind !== "renew") return { error: "Choose a code type." };
  if (kind === "plan" && !planId) return { error: "Plan codes need a plan." };
  if (!Number.isInteger(days) || days < 1 || days > 3650) return { error: "Days must be 1–3650." };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) return { error: "Quantity must be 1–500." };
  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 100000) return { error: "Uses per code must be at least 1." };
  const expiresAt = expires ? new Date(`${expires}T23:59:59Z`) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return { error: "Invalid expiry date." };

  const codes = [...new Set(Array.from({ length: quantity }, newCode))];
  const { error } = await adminClient()
    .from("redeem_codes")
    .insert(
      codes.map((code) => ({
        code,
        kind,
        plan_id: planId,
        days,
        max_uses: maxUses,
        expires_at: expiresAt?.toISOString() ?? null,
        note,
        created_by: admin.id,
      })),
    );
  if (error) return { error: error.message };
  refresh();
  return { ok: true, message: codes.join("\n") };
}

/** Credit (or, with a negative amount, debit) a user's wallet — manual top-ups until a payment provider is connected. */
export async function walletAdjustAction(userId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const amount = Math.round(Number(fd.get("amount")) * 100) / 100;
  const note = String(fd.get("note") ?? "").slice(0, 200) || null;
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 100000) return { error: "Enter an amount (e.g. 10 or -5)." };
  const { data, error } = await adminClient().rpc("wallet_adjust", {
    p_user: userId,
    p_amount: amount,
    p_kind: amount > 0 ? "topup" : "adjustment",
    p_note: note,
    p_by: admin.id,
  });
  if (error) return { error: error.message.includes("INSUFFICIENT_BALANCE") ? "Balance can't go below zero." : error.message };
  refresh();
  return { ok: true, message: `Balance: $${Number(data).toFixed(2)}` };
}

/** Confirms a pending top-up was paid: credits amount + bonus to the user's wallet. */
export async function markTopupPaidAction(topupId: string, _prev: ActionState, _fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const { error } = await adminClient().rpc("wallet_topup_complete", { p_topup: topupId, p_by: admin.id });
  if (error) return { error: error.message.includes("TOPUP_NOT_PENDING") ? "Already handled." : error.message };
  refresh();
  return { ok: true };
}

export async function rejectTopupAction(topupId: string, _prev: ActionState, _fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const { error } = await adminClient()
    .from("wallet_topups")
    .update({ status: "failed", handled_by: admin.id })
    .eq("id", topupId)
    .eq("status", "pending");
  refresh();
  return error ? { error: error.message } : { ok: true };
}
