import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardView } from "@/app/dashboard/dashboard-view";
import { DEMO_BALANCE, DEMO_PROFILE, DEMO_UNREAD, demoDashboard } from "@/lib/demo-data";

// Dev-only preview of the dashboard with mock data, so the UI can be checked without Supabase/agents.
export const metadata: Metadata = { title: "Dashboard preview" };

export default function DashboardPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const { devices, sub } = demoDashboard();
  return (
    <DashboardView
      devices={devices}
      sub={sub}
      newHref="/demo/new"
      unread={DEMO_UNREAD}
      balance={DEMO_BALANCE}
      profile={DEMO_PROFILE}
      readOnly
    />
  );
}
