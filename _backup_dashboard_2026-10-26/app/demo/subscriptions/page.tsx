import { notFound } from "next/navigation";
import { SubscriptionsView } from "@/app/dashboard/subscriptions/subscriptions-view";
import { mockSubscriptions } from "../mock";

export default function SubscriptionsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <SubscriptionsView subs={mockSubscriptions()} deviceCount={6} now={Date.now()} backHref="/demo/dashboard" redeemHref="/demo/redeem" newHref="/demo/new" />
  );
}
