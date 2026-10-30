import { notFound } from "next/navigation";
import { TopupView } from "@/app/dashboard/wallet/topup/topup-view";

export default function TopupPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <TopupView
      balance={12.5}
      pending={[
        {
          id: "t1", reference: "TP-8F3K2M9QXA", user_id: "u", amount: 6.99, bonus: 0.69, method: "dana",
          status: "pending", provider_ref: null, paid_at: null, created_at: new Date().toISOString(),
        },
      ]}
      supportHref="/demo/support"
      walletHref="/demo/wallet"
      backHref="/demo/wallet"
      readOnly
    />
  );
}
