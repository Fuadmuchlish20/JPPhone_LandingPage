import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { CardIcon, ChevronRightIcon, PlusIcon, TicketIcon } from "./icons";

export interface ProfileSummary {
  id: string;
  email: string;
  display_name: string | null;
}

/** Sidebar header: who's signed in, quick links, and the wallet balance. */
export function ProfileCard({ profile, balance, demo }: { profile: ProfileSummary; balance: number; demo?: boolean }) {
  const base = demo ? "/demo" : "/dashboard";
  const name = profile.display_name?.trim() || profile.email.split("@")[0] || "User";

  return (
    <div className="pf">
      <div className="pf-who">
        <span className="pf-avatar" aria-hidden>
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="pf-name">
          <strong title={name}>{name}</strong>
          <span>ID: {profile.id.replace(/-/g, "").slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <nav className="pf-actions" aria-label="Quick actions">
        <Link href={`${base}/redeem`}>
          <span className="pf-action-icon">
            <TicketIcon />
          </span>
          Redeem
        </Link>
        <Link href={`${base}/new`}>
          <span className="pf-action-icon">
            <PlusIcon />
          </span>
          Buy / Renew
        </Link>
        <Link href={`${base}/subscriptions`}>
          <span className="pf-action-icon">
            <CardIcon />
          </span>
          Plan
        </Link>
      </nav>

      <div className="pf-balance">
        <span className="pf-label">
          Wallet Balance
          <span className="pf-help" title="Use your balance to buy or renew plans." aria-label="Use your balance to buy or renew plans.">
            ?
          </span>
        </span>
        <div className="pf-balance-row">
          <strong>{formatPrice(balance, "USD")}</strong>
          <Link href={demo ? "/demo/topup" : "/dashboard/wallet/topup"} className="pf-topup">
            Top-up
          </Link>
        </div>
        <Link href={`${base}/wallet`} className="pf-history">
          Transaction History <ChevronRightIcon />
        </Link>
      </div>
    </div>
  );
}
