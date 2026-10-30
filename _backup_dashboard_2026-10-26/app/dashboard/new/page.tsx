import type { Metadata } from "next";
import { getMyWalletBalance } from "@/lib/account/queries";
import { requireUser } from "@/lib/auth";
import { getActiveSubscription, getAvailableRegions, getMyDevices, getPlans } from "@/lib/devices/queries";
import { NewDeviceView } from "./new-device-view";

export const metadata: Metadata = { title: "New device" };

export default async function NewDevicePage() {
  await requireUser();
  const [plans, sub, devices, regions, walletBalance] = await Promise.all([
    getPlans(),
    getActiveSubscription(),
    getMyDevices(),
    getAvailableRegions(),
    getMyWalletBalance(),
  ]);
  return <NewDeviceView plans={plans} sub={sub} deviceCount={devices.length} regions={regions} walletBalance={walletBalance} />;
}
