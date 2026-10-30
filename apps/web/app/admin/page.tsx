import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import type { HostRow } from "@/lib/db-types";
import { adminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin" };

async function count(table: string, filter?: (q: any) => any): Promise<number> {
  let q = adminClient().from(table).select("id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c ?? 0;
}

export default async function AdminOverview() {
  await requireAdmin();
  const [users, devices, running, activeSubs, hostsRes] = await Promise.all([
    count("profiles"),
    count("devices", (q) => q.neq("status", "deleted")),
    count("devices", (q) => q.eq("status", "running")),
    count("subscriptions", (q) => q.eq("status", "active")),
    adminClient().from("hosts").select("*"),
  ]);
  const hosts = (hostsRes.data ?? []) as HostRow[];
  const online = hosts.filter((h) => h.status === "online").length;
  const capacity = hosts.reduce((s, h) => s + h.capacity, 0);

  const stats = [
    { label: "Users", value: users },
    { label: "Active subscriptions", value: activeSubs },
    { label: "Devices", value: `${devices} / ${capacity} slots` },
    { label: "Running now", value: running },
    { label: "Hosts online", value: `${online} / ${hosts.length}` },
  ];

  return (
    <div className="grid grid-3">
      {stats.map((s) => (
        <div key={s.label} className="card">
          <div className="muted" style={{ fontSize: 13 }}>
            {s.label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
