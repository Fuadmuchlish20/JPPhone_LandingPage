import { ActionButton } from "@/components/ui/action-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth";
import type { DeviceRow } from "@/lib/db-types";
import { formatDate, formatRam, timeAgo } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";
import { adminDeviceAction } from "../actions";

type Row = DeviceRow & { profiles: { email: string } | null; hosts: { name: string; region: string } | null };

export default async function AdminDevicesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  let q = adminClient()
    .from("devices")
    .select("*, profiles(email), hosts(name, region)")
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .limit(500);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  const rows = (data ?? []) as Row[];

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Device</th>
            <th>Owner</th>
            <th>Host</th>
            <th>Status</th>
            <th>Spec</th>
            <th>Last active</th>
            <th>Expires</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id}>
              <td>
                <strong>{d.name}</strong>
                <div className="muted">
                  <code>{d.id}</code>
                </div>
              </td>
              <td>{d.profiles?.email ?? "–"}</td>
              <td>
                {d.hosts?.name} ({d.hosts?.region})
              </td>
              <td>
                <StatusBadge status={d.status} />
                {d.status_message && <div className="form-error">{d.status_message}</div>}
              </td>
              <td>
                {Number(d.cpu)} vCPU · {formatRam(d.ram_mb)} · {d.storage_gb} GB
              </td>
              <td>{timeAgo(d.last_active_at)}</td>
              <td>{formatDate(d.expires_at)}</td>
              <td>
                <div className="row">
                  <ActionButton action={adminDeviceAction.bind(null, d.id, "start")} label="Start" />
                  <ActionButton action={adminDeviceAction.bind(null, d.id, "stop")} label="Stop" />
                  <ActionButton action={adminDeviceAction.bind(null, d.id, "restart")} label="Restart" />
                  <ActionButton
                    action={adminDeviceAction.bind(null, d.id, "delete")}
                    label="Delete"
                    className="btn btn-sm btn-danger"
                    confirm="Delete this device and its data?"
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="muted">
                No devices.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
