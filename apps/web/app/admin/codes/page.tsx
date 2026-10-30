import { requireAdmin } from "@/lib/auth";
import type { PlanRow, RedeemCodeRow } from "@/lib/db-types";
import { formatDate } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";
import { GenerateCodesForm } from "./generate-codes-form";

export default async function AdminCodesPage() {
  await requireAdmin();
  const db = adminClient();
  const [{ data: plans }, { data: codes }] = await Promise.all([
    db.from("plans").select("*").order("sort_order"),
    db.from("redeem_codes").select("*, plans(name)").order("created_at", { ascending: false }).limit(200),
  ]);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <GenerateCodesForm plans={(plans ?? []) as PlanRow[]} />
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Plan</th>
              <th>Days</th>
              <th>Used</th>
              <th>Expires</th>
              <th>Note</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {((codes ?? []) as RedeemCodeRow[]).map((c) => (
              <tr key={c.code}>
                <td>
                  <code>{c.code}</code>
                </td>
                <td>{c.kind === "plan" ? "New phone" : "Renew"}</td>
                <td>{c.plans?.name ?? "Any"}</td>
                <td>{c.days}</td>
                <td>
                  {c.used_count}/{c.max_uses}
                </td>
                <td>{c.expires_at ? formatDate(c.expires_at) : "—"}</td>
                <td className="muted">{c.note ?? ""}</td>
                <td className="muted">{formatDate(c.created_at)}</td>
              </tr>
            ))}
            {(codes ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="muted">
                  No codes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
