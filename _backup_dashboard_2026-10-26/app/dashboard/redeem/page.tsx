import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { RedeemView } from "./redeem-view";

export const metadata: Metadata = { title: "Redeem Code" };

export default async function RedeemPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireUser();
  const { type } = await searchParams;
  return <RedeemView initial={type === "plan" || type === "renew" ? type : undefined} />;
}
