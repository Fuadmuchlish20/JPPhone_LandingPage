"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AutoRefresh } from "@/components/ui/auto-refresh";
import type { DeviceRow, PlanRow, SubscriptionRow } from "@/lib/db-types";
import { AccountMenu } from "./account-menu";
import { DeviceCard, TRANSITIONAL } from "./device-card";
import { ProfileCard, type ProfileSummary } from "./profile-card";
import { LayersIcon, PhoneIcon, PlusIcon } from "./icons";

export function DashboardView({
  devices,
  sub,
  profile,
  balance = 0,
  newHref = "/dashboard/new",
  unread = 0,
  readOnly,
}: {
  devices: DeviceRow[];
  sub: (SubscriptionRow & { plans: PlanRow }) | null;
  profile: ProfileSummary;
  balance?: number;
  newHref?: string;
  unread?: number;
  readOnly?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);



  const renewHref = readOnly ? "/demo/redeem?type=renew" : "/dashboard/redeem?type=renew";

  return (
    <div className="dd">
      <AutoRefresh active={!readOnly && devices.some((d) => TRANSITIONAL.has(d.status))} />

      <aside className="dd-side">
        <ProfileCard profile={profile} balance={balance} demo={readOnly} />

        <nav className="dd-groups" aria-label="Device groups">
          <span className="dd-groups-title">My cloud phones</span>
          <span className="dd-group is-active">
            <LayersIcon />
            <span>All devices</span>
            <em>{devices.length}</em>
          </span>
        </nav>

        <AccountMenu unread={unread} demo={readOnly} />
      </aside>

      <div className="dd-main">
        <header className="dd-head">
          <div>
            <h1>My Cloud Phones</h1>
            <p className="muted">Phones keep running 24/7 — close the tab any time.</p>
          </div>
          <Link href={newHref} className="dd-new">
            <PlusIcon /> New device
          </Link>
        </header>

        {devices.length === 0 ? (
          <div className="dd-empty">
            <PhoneIcon />
            <strong>No cloud phones yet</strong>
            <span className="muted">Create your first device to start playing.</span>
            <Link href={newHref} className="dd-new">
              <PlusIcon /> New device
            </Link>
          </div>
        ) : (
          <div className="dd-grid">
            {devices.map((d) => (
              <DeviceCard
                key={d.id}
                device={d}
                now={now}
                renewHref={renewHref}
                planName={sub?.plan_id === d.plan_id ? sub.plans.name : undefined}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
