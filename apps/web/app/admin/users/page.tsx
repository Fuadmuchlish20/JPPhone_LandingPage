import { ActionButton } from "@/components/ui/action-button";
import { requireAdmin } from "@/lib/auth";
import type { PlanRow, SubscriptionRow } from "@/lib/db-types";
import { formatDate, formatPrice } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";
import { setAdminAction } from "../actions";
import { GrantPlanForm } from "./grant-plan-form";
import { WalletForm } from "./wallet-form";

interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;
  const db = adminClient();

  let usersQ = db.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
  if (q) usersQ = usersQ.ilike("email", `%${q}%`);
  const [{ data: users }, { data: subs }, { data: plans }, { data: devs }, { data: wallets }] = await Promise.all([
    usersQ,
    db.from("subscriptions").select("*, plans(name)").eq("status", "active"),
    db.from("plans").select("*").order("sort_order"),
    db.from("devices").select("user_id").neq("status", "deleted"),
    db.from("wallets").select("user_id, balance"),
  ]);

  const subByUser = new Map(
    ((subs ?? []) as (SubscriptionRow & { plans: { name: string } })[]).map((s) => [s.user_id, s]),
  );
  const balanceByUser = new Map(((wallets ?? []) as { user_id: string; balance: number }[]).map((w) => [w.user_id, Number(w.balance)]));
  const devCount = new Map<string, number>();
  for (const d of (devs ?? []) as { user_id: string }[]) devCount.set(d.user_id, (devCount.get(d.user_id) ?? 0) + 1);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <form className="row">
        <input className="input" name="q" placeholder="Search email…" defaultValue={q} style={{ maxWidth: 320 }} />
        <button className="btn">Search</button>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Joined</th>
              <th>Plan</th>
              <th>Devices</th>
              <th>Grant / extend plan</th>
              <th>Wallet</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {((users ?? []) as UserRow[]).map((u) => {
              const sub = subByUser.get(u.id);
              return (
                <tr key={u.id}>
                  <td>
                    <strong>{u.email}</strong>
                    {u.display_name && <div className="muted">{u.display_name}</div>}
                  </td>
                  <td>{formatDate(u.created_at)}</td>
                  <td>{sub ? `${sub.plans.name} until ${formatDate(sub.current_period_end)}` : <span className="muted">none</span>}</td>
                  <td>{devCount.get(u.id) ?? 0}</td>
                  <td>
                    <GrantPlanForm userId={u.id} plans={(plans ?? []) as PlanRow[]} />
                  </td>
                  <td>
                    <div className="stack" style={{ gap: 4 }}>
                      <strong>{formatPrice(balanceByUser.get(u.id) ?? 0, "USD")}</strong>
                      <WalletForm userId={u.id} />
                    </div>
                  </td>
                  <td>
                    <ActionButton
                      action={setAdminAction.bind(null, u.id, !u.is_admin)}
                      label={u.is_admin ? "Remove admin" : "Make admin"}
                      confirm={u.is_admin ? undefined : `Give ${u.email} admin access?`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
