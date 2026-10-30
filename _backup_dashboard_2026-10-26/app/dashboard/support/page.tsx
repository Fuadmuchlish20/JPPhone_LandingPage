import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getSupportConfig } from "@/lib/support";
import { SupportView } from "./support-view";

export const metadata: Metadata = { title: "Support" };

export default async function SupportPage() {
  await requireUser();
  return <SupportView config={getSupportConfig()} />;
}
