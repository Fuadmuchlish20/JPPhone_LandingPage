import { notFound } from "next/navigation";
import { RedeemView } from "@/app/dashboard/redeem/redeem-view";

export default function RedeemPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <RedeemView backHref="/demo/dashboard" newHref="/demo/new" readOnly />;
}
