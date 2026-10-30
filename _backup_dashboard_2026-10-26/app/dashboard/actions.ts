"use server";

import { refresh } from "next/cache";
import type { DeviceAction } from "@ce/shared/types";
import type { ActionState } from "@/components/ui/action-button";
import { requireUser } from "@/lib/auth";
import { getAvailableRegions, getMyDevice, getPlans } from "@/lib/devices/queries";
import { formatDate } from "@/lib/format";
import { PACKAGES, packagePrice } from "@/lib/plans/packages";
import { createDevice, removeDevice, runDeviceAction } from "@/lib/devices/service";
import { adminClient } from "@/lib/supabase/admin";

const ACTIONS: DeviceAction[] = ["start", "stop", "restart", "reset"];

const PURCHASE_ERRORS: Record<string, string> = {
  INSUFFICIENT_BALANCE: "Not enough wallet balance. Top up first.",
  PLAN_CONFLICT: "You already have a different active plan. Renew it, or wait until it ends.",
  INVALID_PLAN: "That plan is no longer available.",
};

export async function createDeviceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const region = String(formData.get("region") ?? "");
  const name = String(formData.get("name") ?? "").slice(0, 40);
  const android = String(formData.get("android") ?? "13");
  if (!region) return { error: "Choose a region." };
  if (!/^\d{1,2}$/.test(android)) return { error: "Choose an Android version." };
  const res = await createDevice(user.id, region, name, android);
  refresh();
  return res.error ? { error: res.error } : { ok: true };
}

export async function deviceAction(
  deviceId: string,
  action: DeviceAction,
  _prev: ActionState,
  _fd: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!ACTIONS.includes(action)) return { error: "Unknown action." };
  const device = await getMyDevice(deviceId); // RLS: only the owner gets a row
  if (!device) return { error: "Device not found." };
  const res = await runDeviceAction(device, user.id, action);
  refresh();
  return res.error ? { error: res.error } : { ok: true };
}

/**
 * Buys a plan rental from the "new device" page, paid from the user's wallet.
 * Payment-provider hook: to charge a card instead, create the provider's checkout session here
 * and call wallet_adjust (top-up) + wallet_purchase from its webhook.
 */
export async function checkoutAction(
  planSlug: string,
  days: number,
  region: string,
  android: string,
  _prev: ActionState,
  _fd: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const [plans, regions] = await Promise.all([getPlans(), getAvailableRegions()]);
  const plan = plans.find((p) => p.slug === planSlug);
  if (!plan) return { error: "Choose a valid plan." };
  if (!plan.android_versions.includes(android)) return { error: "That Android version isn't available on this plan." };
  if (!PACKAGES.some((p) => p.days === days)) return { error: "Choose a valid package." };
  if (!regions.includes(region)) return { error: "That server is not available right now." };

  const { total } = packagePrice(plan, days); // priced server-side; the client's total is display only
  const { data, error } = await adminClient().rpc("wallet_purchase", {
    p_user: user.id,
    p_plan: plan.id,
    p_days: days,
    p_amount: total,
  });
  if (error) {
    const key = Object.keys(PURCHASE_ERRORS).find((k) => error.message.includes(k));
    return { error: key ? PURCHASE_ERRORS[key] : "Payment failed. Please try again." };
  }
  const row = (Array.isArray(data) ? data[0] : data) as { period_end: string } | undefined;
  refresh();
  return { ok: true, message: row ? `${plan.name} is active until ${formatDate(row.period_end)}. Now create your device.` : "Plan purchased." };
}

export async function renameDeviceAction(deviceId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  if (!name || name.length > 40) return { error: "Name must be 1–40 characters." };
  const device = await getMyDevice(deviceId); // RLS: only the owner gets a row
  if (!device) return { error: "Device not found." };
  const { error } = await adminClient().from("devices").update({ name }).eq("id", device.id);
  if (error) return { error: "Could not rename the device." };
  refresh();
  return { ok: true };
}

export async function deleteDeviceAction(deviceId: string, _prev: ActionState, _fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const device = await getMyDevice(deviceId);
  if (!device) return { error: "Device not found." };
  const res = await removeDevice(device, user.id);
  refresh();
  return res.error ? { error: res.error } : { ok: true };
}
