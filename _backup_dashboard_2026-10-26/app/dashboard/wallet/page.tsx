import type { Metadata } from "next";
import { getMyWalletBalance, getMyWalletTransactions } from "@/lib/account/queries";
import { requireUser } from "@/lib/auth";
import { WalletView } from "./wallet-view";

export const metadata: Metadata = { title: "Wallet" };

export default async function WalletPage() {
  await requireUser();
  const [balance, transactions] = await Promise.all([getMyWalletBalance(), getMyWalletTransactions()]);
  return <WalletView balance={balance} transactions={transactions} />;
}
