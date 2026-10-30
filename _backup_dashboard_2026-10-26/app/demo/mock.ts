// Mock data for the dev-only /demo pages (no Supabase needed).
import type { MessageRow, OrderRow, PlanRow, SubscriptionRow, WalletTransactionRow } from "@/lib/db-types";
import { FALLBACK_PLANS } from "@/lib/plans/fallback";

const DAY = 86_400_000;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();
const plan = (slug: string) => FALLBACK_PLANS.find((p) => p.slug === slug)!;

export function mockSubscriptions(): (SubscriptionRow & { plans: PlanRow })[] {
  return [
    { id: "s3", user_id: "u", plan_id: "mvip", status: "active", current_period_start: iso(-10 * DAY), current_period_end: iso(20 * DAY), plans: plan("mvip") },
    { id: "s2", user_id: "u", plan_id: "kvip", status: "canceled", current_period_start: iso(-40 * DAY), current_period_end: iso(-10 * DAY), plans: plan("kvip") },
    { id: "s1", user_id: "u", plan_id: "uvip", status: "expired", current_period_start: iso(-80 * DAY), current_period_end: iso(-50 * DAY), plans: plan("uvip") },
  ];
}

export function mockOrders(): OrderRow[] {
  const o = (id: string, kind: OrderRow["kind"], source: OrderRow["source"], slug: string, days: number, amount: number, ago: number, reference: string | null = null): OrderRow => ({
    id, user_id: "u", plan_id: slug, kind, source, status: "paid", days, amount, currency: "USD", reference,
    subscription_id: null, created_at: iso(-ago * DAY), plans: { name: plan(slug).name, slug },
  });
  return [
    o("o4", "renew", "redeem", "mvip", 7, 0, 2, "K7QM••••"),
    o("o3", "new", "admin", "mvip", 30, 0, 10),
    o("o2", "new", "redeem", "kvip", 30, 0, 40, "TX4P••••"),
    o("o1", "new", "payment", "uvip", 30, 4.99, 80),
  ];
}

export function mockMessages(): MessageRow[] {
  const m = (id: string, kind: MessageRow["kind"], title: string, body: string, ago: number, read: boolean, link: string | null = null): MessageRow => ({
    id, user_id: "u", kind, title, body, link, read_at: read ? iso(-ago * DAY) : null, created_at: iso(-ago * DAY),
  });
  return [
    m("m4", "warning", "MIR4 Alt expires soon", "Your plan ends in 2 days. Renew to keep your devices running.", 0.05, false, "/demo/redeem"),
    m("m3", "success", "MVIP renewed", "7 day(s) added with a redeem code. Active until 9 Nov 2026 (UTC).", 2, false, "/demo/subscriptions"),
    m("m2", "success", "MVIP activated", "Your MVIP plan is active until 2 Nov 2026.", 10, true, "/demo/subscriptions"),
    m("m1", "info", "Welcome to claudeemulator", "Create your first cloud phone from the dashboard.", 40, true),
  ];
}

export function mockWalletTransactions(): WalletTransactionRow[] {
  const t = (id: string, kind: WalletTransactionRow["kind"], amount: number, after: number, note: string | null, ago: number): WalletTransactionRow => ({
    id, user_id: "u", kind, amount, balance_after: after, note, order_id: null, created_at: iso(-ago * DAY),
  });
  return [
    t("t3", "purchase", -24.99, 12.5, "MVIP · 30 days", 10),
    t("t2", "topup", 30, 37.49, "Bank transfer", 11),
    t("t1", "topup", 7.49, 7.49, "Promo credit", 40),
  ];
}
