import { notFound } from "next/navigation";
import { WalletView } from "@/app/dashboard/wallet/wallet-view";
import { mockWalletTransactions } from "../mock";

export default function WalletPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <WalletView balance={12.5} transactions={mockWalletTransactions()} topupHref="/demo/topup" backHref="/demo/dashboard" newHref="/demo/new" />;
}
