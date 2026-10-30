import type { Metadata } from "next";
import { getMyTopups, getMyWalletBalance } from "@/lib/account/queries";
import { requireUser } from "@/lib/auth";
import { getSupportConfig } from "@/lib/support";
import { TopupView } from "./topup-view";

export const metadata: Metadata = { title: "Top-up" };

export default async function TopupPage() {
  await requireUser();
  const [balance, topups] = await Promise.all([getMyWalletBalance(), getMyTopups()]);
  return (
    <TopupView
      balance={balance}
      pending={topups.filter((t) => t.status === "pending")}
      supportHref={getSupportConfig().chatUrl ?? "/dashboard/support"}
    />
  );
}
