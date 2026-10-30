import { ActionButton } from "@/components/ui/action-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth";
import type { HostRow } from "@/lib/db-types";
import { timeAgo } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";
import { checkHostAction, setHostStatusAction } from "../actions";
import { AddHostForm } from "./add-host-form";

export default async function HostsPage() {
  await requireAdmin();
  const db = adminClient();
  const [{ data }, { data: devs }] = await Promise.all([
    db.from("hosts").select("*").order("region").order("name"),
    db.from("devices").select("host_id").neq("status", "deleted"),
  ]);
  const hosts = (data ?? []) as HostRow[];
  const used = new Map<string, number>();
  for (const d of (devs ?? []) as { host_id: string }[]) used.set(d.host_id, (used.get(d.host_id) ?? 0) + 1);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <AddHostForm />
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Region</th>
              <th>Status</th>
              <th>Devices</th>
              <th>CPU</th>
              <th>RAM</th>
              <th>Disk</th>
              <th>Streams</th>
              <th>Heartbeat</th>
              <th>Host ID</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {hosts.map((h) => (
              <tr key={h.id}>
                <td>
                  <strong>{h.name}</strong>
                  <div className="muted">{h.public_url}</div>
                </td>
                <td>{h.region}</td>
                <td>
                  <StatusBadge status={h.status} />
                </td>
                <td>
                  {used.get(h.id) ?? 0} / {h.capacity}
                </td>
                <td>{h.metrics.cpu_percent ?? "–"}%</td>
                <td>
                  {h.metrics.mem_used_mb ? `${Math.round(h.metrics.mem_used_mb / 1024)}/${Math.round((h.metrics.mem_total_mb ?? 0) / 1024)} GB` : "–"}
                </td>
                <td>{h.metrics.disk_used_gb !== undefined ? `${h.metrics.disk_used_gb}/${h.metrics.disk_total_gb} GB` : "–"}</td>
                <td>{h.metrics.active_sessions ?? "–"}</td>
                <td>{timeAgo(h.last_heartbeat)}</td>
                <td>
                  <code>{h.id}</code>
                </td>
                <td>
                  <div className="row">
                    {(["online", "draining", "maintenance"] as const)
                      .filter((s) => s !== h.status)
                      .map((s) => (
                        <ActionButton key={s} action={setHostStatusAction.bind(null, h.id, s)} label={s} />
                      ))}
                    <ActionButton action={checkHostAction.bind(null, h.id)} label="Ping" />
                  </div>
                </td>
              </tr>
            ))}
            {hosts.length === 0 && (
              <tr>
                <td colSpan={11} className="muted">
                  No hosts yet. Add one above, then put its Host ID in the agent&apos;s .env.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
