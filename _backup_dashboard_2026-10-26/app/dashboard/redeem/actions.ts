"use server";

import { refresh } from "next/cache";
import type { ActionState } from "@/components/ui/action-button";
import { requireUser } from "@/lib/auth";
import type { RedeemKind } from "@/lib/db-types";
import { formatDate } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";

const ERRORS: Record<string, string | ((kind: RedeemKind) => string)> = {
  INVALID_CODE: "That code doesn't exist. Check it and try again.",
  WRONG_KIND: (kind) =>
    kind === "plan" ? "This is a renewal code — use Renew cloud phone instead." : "This code activates a plan — use Add new cloud phone instead.",
  CODE_EXPIRED: "This code has expired.",
  CODE_USED_UP: "This code has already been used.",
  ALREADY_REDEEMED: "You've already redeemed this code.",
  PLAN_CONFLICT: "You already have a different active plan. Use a renewal code, or wait until your plan ends.",
  NO_SUBSCRIPTION: "You don't have a plan to renew yet. Redeem a plan code first.",
  PLAN_MISMATCH: "This renewal code is for a different plan.",
};

export async function redeemCodeAction(kind: RedeemKind, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (kind !== "plan" && kind !== "renew") return { error: "Unknown code type." };
  const code = String(fd.get("code") ?? "")
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!/^[A-Z0-9-]{6,40}$/.test(code)) return { error: "Enter a valid code." };

  const { data, error } = await adminClient().rpc("redeem_code", { p_user: user.id, p_code: code, p_kind: kind });
  if (error) {
    const key = Object.keys(ERRORS).find((k) => error.message.includes(k));
    const msg = key ? ERRORS[key]! : "Could not redeem this code. Please try again.";
    return { error: typeof msg === "function" ? msg(kind) : msg };
  }
  const row = (Array.isArray(data) ? data[0] : data) as { plan_name: string; days: number; period_end: string } | undefined;
  refresh();
  return {
    ok: true,
    message: row
      ? `${row.days} day(s) of ${row.plan_name} added. Active until ${formatDate(row.period_end)}.`
      : "Code redeemed.",
  };
}
