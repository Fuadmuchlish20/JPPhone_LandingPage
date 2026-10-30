import Link from "next/link";
import type { WalletTransactionRow } from "@/lib/db-types";
import { formatDate, formatPrice } from "@/lib/format";
import { AccountShell } from "../account-shell";
import { CardIcon, HeadsetIcon } from "../icons";

const KIND_LABEL: Record<WalletTransactionRow["kind"], string> = {
  topup: "Top-up",
  purchase: "Plan purchase",
  refund: "Refund",
  adjustment: "Adjustment",
};

export function WalletView({
  balance,
  transactions,
  topupHref = "/dashboard/wallet/topup",
  backHref,
  newHref = "/dashboard/new",
}: {
  balance: number;
  transactions: WalletTransactionRow[];
  topupHref?: string;
  backHref?: string;
  newHref?: string;
}) {
  return (
    <AccountShell title="Wallet" backHref={backHref}>
      <section className="wl-card">
        <span className="pf-label">Wallet Balance</span>
        <strong className="wl-amount">{formatPrice(balance, "USD")}</strong>
        <p className="muted">Use your balance to buy or renew any plan on the New device page.</p>
        <div className="sb-actions">
          <Link href={newHref} className="dd-new">
            Buy / Renew plan
          </Link>
        </div>
      </section>

      <section className="ac-section" id="topup">
        <h2>Top-up</h2>
        <div className="wl-topup">
          <HeadsetIcon />
          <div>
            <strong>Add balance</strong>
            <span>Pick an amount and payment method. Some amounts include bonus balance.</span>
          </div>
          <Link href={topupHref} className="pf-topup">
            Top-up
          </Link>
        </div>
      </section>

      <section className="ac-section">
        <h2>Transaction History</h2>
        {transactions.length === 0 ? (
          <div className="ac-empty">
            <CardIcon />
            <strong>No transactions yet</strong>
            <span className="muted">Top-ups and plan purchases will show up here.</span>
          </div>
        ) : (
          <ul className="ac-list">
            {transactions.map((t) => (
              <li key={t.id} className="ac-item">
                <span className="ac-item-icon">
                  <CardIcon />
                </span>
                <div className="ac-item-main">
                  <strong>{KIND_LABEL[t.kind]}</strong>
                  <span>
                    {formatDate(t.created_at)}
                    {t.note && <> · {t.note}</>}
                  </span>
                </div>
                <div className="ac-item-end">
                  <strong className={Number(t.amount) > 0 ? "wl-plus" : undefined}>
                    {Number(t.amount) > 0 ? "+" : "−"}
                    {formatPrice(Math.abs(Number(t.amount)), "USD")}
                  </strong>
                  <span className="muted wl-after">Balance {formatPrice(Number(t.balance_after), "USD")}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountShell>
  );
}
