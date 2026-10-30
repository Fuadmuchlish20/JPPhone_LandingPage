import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewDeviceView } from "@/app/dashboard/new/new-device-view";
import type { PlanRow, SubscriptionRow } from "@/lib/db-types";
import { FALLBACK_PLANS } from "@/lib/plans/fallback";

// Dev-only preview of the "new device" page with mock data.
export const metadata: Metadata = { title: "New device preview" };

export default function NewDevicePreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const plan = FALLBACK_PLANS[3]!;
  const now = Date.now();
  const sub: SubscriptionRow & { plans: PlanRow } = {
    id: "s", user_id: "u", plan_id: plan.id, status: "active",
    current_period_start: new Date(now - 10 * 86_400_000).toISOString(),
    current_period_end: new Date(now + 20 * 86_400_000).toISOString(),
    plans: plan,
  };
  return <NewDeviceView plans={FALLBACK_PLANS} sub={sub} deviceCount={3} regions={["id", "sg", "hk", "jp", "us"]} walletBalance={12.5} walletHref="/demo/wallet" backHref="/demo/dashboard" readOnly />;
}
