"use server";

import { refresh } from "next/cache";
import type { ActionState } from "@/components/ui/action-button";
import { requireUser } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { PAYMENT_METHODS, TOPUP_MAX, TOPUP_MIN, bonusFor, roundMoney } from "@/lib/wallet/topup";

/**
 * Creates a pending top-up and returns its reference in `message`.
 * Payment-provider hook: create the provider's payment for this top-up here and return its URL;
 * the provider's webhook then calls wallet_topup_complete(topup_id).
 */
export async function createTopupAction(amountIn: number, method: string, _prev: ActionState, _fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const amount = roundMoney(Number(amountIn));
  if (!Number.isFinite(amount) || amount < TOPUP_MIN || amount > TOPUP_MAX) {
    return { error: `Enter an amount between $${TOPUP_MIN} and $${TOPUP_MAX}.` };
  }
  if (!PAYMENT_METHODS.some((m) => m.id === method)) return { error: "Choose a payment method." };

  const db = adminClient();
  const { count } = await db
    .from("wallet_topups")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");
  if ((count ?? 0) >= 5) return { error: "You have 5 pending top-ups. Complete or cancel one first." };

  const { data, error } = await db
    .from("wallet_topups")
    .insert({ user_id: user.id, amount, bonus: bonusFor(amount), method })
    .select("reference")
    .single();
  if (error || !data) return { error: "Could not create the top-up. Please try again." };
  refresh();
  return { ok: true, message: (data as { reference: string }).reference };
}

export async function cancelTopupAction(topupId: string, _prev: ActionState, _fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const { error } = await adminClient()
    .from("wallet_topups")
    .update({ status: "canceled" })
    .eq("id", topupId)
    .eq("user_id", user.id)
    .eq("status", "pending");
  if (error) return { error: "Could not cancel." };
  refresh();
  return { ok: true };
}
