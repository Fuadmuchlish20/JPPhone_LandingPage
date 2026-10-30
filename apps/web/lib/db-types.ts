import type { DeviceStatus, HostMetrics, HostStatus } from "@ce/shared/types";

export interface PlanRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cpu: number;
  ram_mb: number;
  storage_gb: number;
  max_devices: number;
  price: number;
  currency: string;
  period_days: number;
  idle_stop_minutes: number | null;
  /** Selectable Android major versions, e.g. ["10", "12", "13", "15"]. */
  android_versions: string[];
  is_active: boolean;
  sort_order: number;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "expired" | "canceled";
  current_period_start: string;
  current_period_end: string;
  plans?: PlanRow;
}

export interface HostRow {
  id: string;
  name: string;
  region: string;
  public_url: string;
  capacity: number;
  status: HostStatus;
  last_heartbeat: string | null;
  metrics: Partial<HostMetrics>;
  created_at: string;
}

export interface DeviceRow {
  id: string;
  user_id: string;
  host_id: string;
  plan_id: string;
  name: string;
  container_id: string | null;
  status: DeviceStatus;
  status_message: string | null;
  android_version: string;
  cpu: number;
  ram_mb: number;
  storage_gb: number;
  last_active_at: string;
  created_at: string;
  expires_at: string;
}

export type RedeemKind = "plan" | "renew";

export interface OrderRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  kind: "new" | "renew";
  source: "payment" | "redeem" | "admin" | "wallet";
  status: "pending" | "paid" | "failed" | "refunded";
  days: number;
  amount: number;
  currency: string;
  reference: string | null;
  subscription_id: string | null;
  created_at: string;
  plans?: Pick<PlanRow, "name" | "slug"> | null;
}

export interface MessageRow {
  id: string;
  user_id: string;
  kind: "info" | "success" | "warning";
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface RedeemCodeRow {
  code: string;
  kind: RedeemKind;
  plan_id: string | null;
  days: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  plans?: Pick<PlanRow, "name"> | null;
}

export interface WalletTransactionRow {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  kind: "topup" | "purchase" | "refund" | "adjustment";
  note: string | null;
  order_id: string | null;
  created_at: string;
}

export interface WalletTopupRow {
  id: string;
  reference: string;
  user_id: string;
  amount: number;
  bonus: number;
  method: string;
  status: "pending" | "paid" | "canceled" | "failed";
  provider_ref: string | null;
  paid_at: string | null;
  created_at: string;
}
