import { ActionButton } from "@/components/ui/action-button";
import { requireAdmin } from "@/lib/auth";
import type { WalletTopupRow } from "@/lib/db-types";
import { formatDate, formatPrice } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";
import { PAYMENT_METHODS } from "@/lib/wallet/topup";
import { markTopupPaidAction, rejectTopupAction } from "../actions";

type Row = WalletTopupRow & { profiles: { email: string } | null };

export default async function AdminTopupsPage() {
  await requireAdmin();
  const { data } = await adminClient()
    .from("wallet_topups")
    .select("*, profiles!wallet_topups_user_id_fkey(email)")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];
  const method = (id: string) => PAYMENT_METHODS.find((m) => m.id === id)?.name ?? id;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <p className="muted" style={{ margin: 0 }}>
        Match the reference the customer sends you with their payment, then mark it paid to credit their wallet (amount + bonus).
      </p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>User</th>
              <th>Amount</th>
              <th>Bonus</th>
              <th>Method</th>
              <th>Created</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>
                  <code>{t.reference}</code>
                </td>
                <td>{t.profiles?.email ?? t.user_id}</td>
                <td>{formatPrice(Number(t.amount), "USD")}</td>
                <td>{Number(t.bonus) > 0 ? formatPrice(Number(t.bonus), "USD") : "—"}</td>
                <td>{method(t.method)}</td>
                <td className="muted">{formatDate(t.created_at)}</td>
                <td>
                  <span className={`badge badge-${t.status === "paid" ? "running" : t.status === "pending" ? "starting" : "stopped"}`}>{t.status}</span>
                </td>
                <td>
                  {t.status === "pending" && (
                    <div className="row" style={{ gap: 6 }}>
                      <ActionButton
                        action={markTopupPaidAction.bind(null, t.id)}
                        label="Mark paid"
                        className="btn btn-sm btn-primary"
                        confirm={`Credit ${formatPrice(Number(t.amount) + Number(t.bonus), "USD")} to ${t.profiles?.email ?? "this user"}?`}
                      />
                      <ActionButton action={rejectTopupAction.bind(null, t.id)} label="Reject" className="btn btn-sm btn-danger" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="muted">
                  No top-ups yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
