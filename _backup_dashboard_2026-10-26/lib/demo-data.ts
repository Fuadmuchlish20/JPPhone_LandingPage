// Sample dashboard data for the /demo previews and the landing-page mockup (no Supabase needed).
import type { DeviceRow, PlanRow, SubscriptionRow } from "./db-types";

const DAY = 86_400_000;

export const DEMO_PROFILE = { id: "19708237-0000-4000-8000-000000000000", email: "xio.jue@example.com", display_name: "Xio Jue" };
export const DEMO_BALANCE = 12.5;
export const DEMO_UNREAD = 2;

export function demoDashboard(now = Date.now()): { devices: DeviceRow[]; sub: SubscriptionRow & { plans: PlanRow } } {
  const iso = (offset: number) => new Date(now + offset).toISOString();
  const plan: PlanRow = {
    id: "p", slug: "mvip", name: "MVIP", description: null, cpu: 8, ram_mb: 8192, storage_gb: 128, max_devices: 8,
    price: 24.99, currency: "USD", period_days: 30, idle_stop_minutes: null, android_versions: ["10", "12", "13", "15"], is_active: true, sort_order: 4,
  };
  const sub: SubscriptionRow & { plans: PlanRow } = {
    id: "s", user_id: "u", plan_id: "p", status: "active", current_period_start: iso(-10 * DAY), current_period_end: iso(20 * DAY), plans: plan,
  };
  const mk = (i: number, name: string, status: DeviceRow["status"], expires: number, message: string | null = null): DeviceRow => ({
    id: `00000000-0000-0000-0000-00000000000${i}`, user_id: "u", host_id: "h", plan_id: "p", name, container_id: null,
    status, status_message: message, android_version: "13", cpu: 8, ram_mb: 8192, storage_gb: 128,
    last_active_at: iso(-DAY), created_at: iso(-10 * DAY), expires_at: iso(expires),
  });
  const devices: DeviceRow[] = [
    mk(1, "Lineage Farm 1", "running", 20 * DAY),
    mk(2, "Lineage Farm 2", "running", 20 * DAY),
    mk(3, "Roblox AFK", "starting", 20 * DAY),
    mk(4, "MIR4 Alt", "stopped", 2 * DAY),
    mk(5, "Odin Main", "running", 5 * 3_600_000),
    mk(6, "Test Device", "error", 12 * DAY, "Boot timed out after 180s"),
  ];
  return { devices, sub };
}
