import type { OrderRow } from "@/lib/db-types";
import { formatDate, formatPrice } from "@/lib/format";
import { AccountShell } from "../account-shell";
import { ReceiptIcon } from "../icons";

const SOURCE_LABEL: Record<OrderRow["source"], string> = { payment: "Payment", redeem: "Redeem code", admin: "Granted by support", wallet: "Wallet" };
const STATUS_LABEL: Record<OrderRow["status"], string> = { pending: "Pending", paid: "Completed", failed: "Failed", refunded: "Refunded" };

export function OrdersView({ orders, backHref }: { orders: OrderRow[]; backHref?: string }) {
  return (
    <AccountShell title="Order History" backHref={backHref}>
      {orders.length === 0 ? (
        <div className="ac-empty">
          <ReceiptIcon />
          <strong>No orders yet</strong>
          <span className="muted">Plan purchases, renewals and redeemed codes will show up here.</span>
        </div>
      ) : (
        <ul className="ac-list">
          {orders.map((o) => (
            <li key={o.id} className="ac-item">
              <span className="ac-item-icon">
                <ReceiptIcon />
              </span>
              <div className="ac-item-main">
                <strong>
                  {o.kind === "new" ? "New plan" : "Renewal"} · {o.plans?.name ?? "Plan"} · {o.days} day{o.days === 1 ? "" : "s"}
                </strong>
                <span>
                  {formatDate(o.created_at)} · {SOURCE_LABEL[o.source]}
                  {o.reference && <> · {o.reference}</>}
                </span>
              </div>
              <div className="ac-item-end">
                <strong>{Number(o.amount) > 0 ? formatPrice(Number(o.amount), o.currency) : "Free"}</strong>
                <span className={`ac-badge ac-badge-${o.status}`}>{STATUS_LABEL[o.status]}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
