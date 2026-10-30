import type { PlanRow } from "../db-types";

// Mirrors infra/supabase/seed.sql so public pages and previews still render when Supabase is unreachable.
const plan = (sort: number, slug: string, description: string, cpu: number, ram_mb: number, storage_gb: number, max_devices: number, price: number): PlanRow => ({
  id: slug, slug, name: slug.toUpperCase(), description, cpu, ram_mb, storage_gb, max_devices, price,
  currency: "USD", period_days: 30, idle_stop_minutes: null, android_versions: ["10", "12", "13", "15"], is_active: true, sort_order: sort,
});

export const FALLBACK_PLANS: PlanRow[] = [
  plan(1, "uvip", "Popular games support, smooth experience", 3, 3072, 30, 1, 4.99),
  plan(2, "gvip", "Bigger RAM, 24/7 AFK", 3, 4096, 64, 2, 7.99),
  plan(3, "kvip", "Cost effective, smooth AFK", 6, 5427, 64, 3, 12.99),
  plan(4, "mvip", "Higher performance, stable AFK", 8, 8192, 128, 5, 24.99),
  plan(5, "svip", "Premium RAM, stable AFK", 8, 16384, 200, 8, 39.99),
];
