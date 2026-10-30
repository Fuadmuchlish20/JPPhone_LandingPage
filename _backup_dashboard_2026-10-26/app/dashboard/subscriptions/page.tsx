import type { Metadata } from "next";
import { getMySubscriptions } from "@/lib/account/queries";
import { requireUser } from "@/lib/auth";
import { getMyDevices } from "@/lib/devices/queries";
import { SubscriptionsView } from "./subscriptions-view";

export const metadata: Metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage() {
  await requireUser();
  const [subs, devices] = await Promise.all([getMySubscriptions(), getMyDevices()]);
  return <SubscriptionsView subs={subs} deviceCount={devices.length} now={Date.now()} />;
}
