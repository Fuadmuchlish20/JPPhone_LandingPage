import type { Metadata } from "next";
import { getMyWalletBalance, getUnreadMessageCount } from "@/lib/account/queries";
import { getProfile, requireUser } from "@/lib/auth";
import { getActiveSubscription, getMyDevices } from "@/lib/devices/queries";
import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = { title: "Devices" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [devices, sub, unread, profile, balance] = await Promise.all([
    getMyDevices(),
    getActiveSubscription(),
    getUnreadMessageCount(),
    getProfile(),
    getMyWalletBalance(),
  ]);
  return (
    <DashboardView
      devices={devices}
      sub={sub}
      unread={unread}
      balance={balance}
      profile={profile ?? { id: user.id, email: user.email ?? "", display_name: null }}
    />
  );
}
