import Link from "next/link";
import type { PlanRow, SubscriptionRow } from "@/lib/db-types";
import { formatDate, formatRam } from "@/lib/format";
import { AccountShell } from "../account-shell";
import { CardIcon } from "../icons";

type Sub = SubscriptionRow & { plans: PlanRow };

const STATUS_LABEL: Record<Sub["status"], string> = { active: "Active", expired: "Expired", canceled: "Replaced" };

export function SubscriptionsView({
  subs,
  deviceCount,
  now,
  backHref,
  redeemHref = "/dashboard/redeem",
  newHref = "/dashboard/new",
}: {
  subs: Sub[];
  deviceCount: number;
  now: number;
  backHref?: string;
  redeemHref?: string;
  newHref?: string;
}) {
  const current = subs.find((s) => s.status === "active" && new Date(s.current_period_end).getTime() > now) ?? null;
  const history = subs.filter((s) => s !== current);

  return (
    <AccountShell title="Subscriptions" backHref={backHref}>
      {current ? (
        <CurrentPlan sub={current} deviceCount={deviceCount} now={now} redeemHref={redeemHref} newHref={newHref} />
      ) : (
        <div className="ac-empty">
          <CardIcon />
          <strong>No active plan</strong>
          <span className="muted">Buy a plan or redeem a code to start a cloud phone.</span>
          <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
            <Link href={newHref} className="dd-new">
              Choose a plan
            </Link>
            <Link href={`${redeemHref}?type=plan`} className="vd-more-btn">
              Redeem code
            </Link>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <section className="ac-section">
          <h2>History</h2>
          <ul className="ac-list">
            {history.map((s) => (
              <li key={s.id} className="ac-item">
                <span className="ac-item-icon">
                  <CardIcon />
                </span>
                <div className="ac-item-main">
                  <strong>{s.plans.name}</strong>
                  <span>
                    {formatDate(s.current_period_start)} – {formatDate(s.current_period_end)}
                  </span>
                </div>
                <span className={`ac-badge ac-badge-${s.status}`}>{STATUS_LABEL[s.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AccountShell>
  );
}

function CurrentPlan({ sub, deviceCount, now, redeemHref, newHref }: { sub: Sub; deviceCount: number; now: number; redeemHref: string; newHref: string }) {
  const p = sub.plans;
  const start = new Date(sub.current_period_start).getTime();
  const end = new Date(sub.current_period_end).getTime();
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86_400_000));
  const pctLeft = end > start ? Math.max(0, Math.min(100, ((end - now) / (end - start)) * 100)) : 0;

  return (
    <section className="sb-card">
      <div className="sb-top">
        <div>
          <span className="sb-label">Current plan</span>
          <h2>{p.name}</h2>
          {p.description && <p className="muted">{p.description}</p>}
        </div>
        <span className="ac-badge ac-badge-active">Active</span>
      </div>

      <dl className="sb-specs">
        <div>
          <dt>CPU</dt>
          <dd>{Number(p.cpu)} cores</dd>
        </div>
        <div>
          <dt>RAM</dt>
          <dd>{formatRam(p.ram_mb)}</dd>
        </div>
        <div>
          <dt>Storage</dt>
          <dd>{p.storage_gb} GB</dd>
        </div>
        <div>
          <dt>Devices</dt>
          <dd>
            {deviceCount}/{p.max_devices}
          </dd>
        </div>
      </dl>

      <div className="sb-time">
        <div className="sb-time-row">
          <strong className={daysLeft <= 3 ? "dd-warn-text" : undefined}>
            {daysLeft} day{daysLeft === 1 ? "" : "s"} left
          </strong>
          <span className="muted">
            {formatDate(sub.current_period_start)} – {formatDate(sub.current_period_end)}
          </span>
        </div>
        <div className="sb-meter" aria-hidden>
          <i style={{ width: `${pctLeft}%` }} />
        </div>
      </div>

      <div className="sb-actions">
        <Link href={`${redeemHref}?type=renew`} className="dd-new">
          Renew with code
        </Link>
        <Link href={newHref} className="vd-more-btn">
          Buy / upgrade
        </Link>
      </div>
    </section>
  );
}
