"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import type { ActionState } from "@/components/ui/action-button";
import { GAMES, gamesForPlan, type GameKey } from "@/lib/games";
import type { PlanRow, SubscriptionRow } from "@/lib/db-types";
import { formatDate, formatPrice, formatRam } from "@/lib/format";
import { PACKAGES, packagePrice } from "@/lib/plans/packages";
import { regionName } from "@/lib/regions";
import { checkoutAction, createDeviceAction } from "../actions";
import { ArrowLeftIcon, CheckIcon, ChevronDownIcon, GamepadIcon, HeadsetIcon } from "../icons";

type Sub = (SubscriptionRow & { plans: PlanRow }) | null;

// Same tints as the plan cards on the homepage.
const PLAN_THEMES: Record<string, string> = { uvip: "slate", gvip: "bronze", kvip: "violet", mvip: "teal", svip: "rose" };
const PACKAGE_BADGES: Record<number, string> = { 30: "Recommend", 90: "Best Value" };

export function NewDeviceView({
  plans,
  sub,
  deviceCount,
  regions,
  walletBalance,
  walletHref = "/dashboard/wallet",
  backHref = "/dashboard",
  readOnly,
}: {
  plans: PlanRow[];
  sub: Sub;
  deviceCount: number;
  regions: string[];
  walletBalance: number;
  walletHref?: string;
  backHref?: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(() => sub?.plans.slug ?? plans[Math.min(1, plans.length - 1)]?.slug ?? "");
  const [region, setRegion] = useState(regions[0] ?? "");
  const [days, setDays] = useState<number>(30);
  const [androidPick, setAndroidPick] = useState("13");
  const [name, setName] = useState("");
  const [gamesOpen, setGamesOpen] = useState(false);
  const [game, setGame] = useState<GameKey | null>(null);

  const plan = plans.find((p) => p.slug === slug) ?? plans[0];
  const onCurrentPlan = !!sub && !!plan && sub.plans.slug === plan.slug;
  const slotsLeft = sub ? sub.plans.max_devices - deviceCount : 0;
  const included = onCurrentPlan && slotsLeft > 0;
  const versions = useMemo(
    () => [...(plan?.android_versions ?? ["13"])].sort((a, b) => Number(a) - Number(b)),
    [plan],
  );
  // Keep the user's pick when the new plan offers it; otherwise prefer 13, then the newest.
  const android = versions.includes(androidPick) ? androidPick : versions.includes("13") ? "13" : versions[versions.length - 1]!;

  const [createState, createForm, creating] = useActionState(createDeviceAction, null);
  const [checkoutState, checkoutForm, checkingOut] = useActionState(
    (prev: ActionState, fd: FormData) => checkoutAction(slug, days, region, android, prev, fd),
    null,
  );
  useEffect(() => {
    if (createState?.ok) router.push(backHref);
  }, [createState, router, backHref]);

  const allGames = useMemo(() => {
    const keys = new Set<GameKey>();
    plans.forEach((p) => gamesForPlan(p.slug).forEach((k) => keys.add(k)));
    return [...keys];
  }, [plans]);

  function pickGame(k: GameKey) {
    setGame(k);
    // Cheapest plan (plans are sorted) whose list includes the game.
    const best = plans.find((p) => gamesForPlan(p.slug).includes(k));
    if (best) setSlug(best.slug);
    setGamesOpen(false);
  }

  if (!plan) {
    return (
      <div className="nd">
        <p className="muted">No plans are configured yet.</p>
      </div>
    );
  }

  const price = packagePrice(plan, days);
  const pending = creating || checkingOut;
  const error = included ? createState?.error : checkoutState?.error;
  const noRegion = regions.length === 0;

  const theme = PLAN_THEMES[plan.slug] ?? "slate";
  const ramLabel = formatRam(plan.ram_mb).replace(" ", "");

  return (
    <div className={`nd nd-v2 dm-${theme}`}>
      <header className="nd-top">
        <Link href={backHref} className="nd-top-btn" aria-label="Back to devices">
          <ArrowLeftIcon />
        </Link>
        <h1>Buy device</h1>
        <Link href="/dashboard/support" className="nd-top-btn" aria-label="Support">
          <HeadsetIcon />
        </Link>
      </header>

      <div className="nd-body">
        {/* plan tabs */}
        <div className="nd-ptabs" role="tablist" aria-label="Plan">
          {plans.map((p) => (
            <button
              key={p.slug}
              role="tab"
              aria-selected={p.slug === slug}
              className={`nd-ptab${p.slug === slug ? " is-active" : ""}`}
              onClick={() => setSlug(p.slug)}
            >
              {p.name}
              {sub?.plans.slug === p.slug && <span className="nd-ptab-badge">Current</span>}
            </button>
          ))}
        </div>

        {/* plan card */}
        <section className={`nd-pcard dm-${theme}`} aria-label={`${plan.name} specifications`}>
          <span className="nd-pcard-art" aria-hidden>
            {plan.name.charAt(0)}
          </span>
          <p className="nd-pcard-tag">{plan.description}</p>
          <dl className="nd-pcard-specs">
            <div>
              <dt>Cores</dt>
              <dd>{Number(plan.cpu)}x</dd>
            </div>
            <div>
              <dt>RAM</dt>
              <dd>{ramLabel}</dd>
            </div>
            <div>
              <dt>ROM</dt>
              <dd>{plan.storage_gb}GB</dd>
            </div>
            <div>
              <dt>Devices</dt>
              <dd>{plan.max_devices}</dd>
            </div>
          </dl>
        </section>

        {/* choose by game */}
        <div className={`nd-games${gamesOpen ? " is-open" : ""}`}>
          <button className="nd-games-head" onClick={() => setGamesOpen((v) => !v)} aria-expanded={gamesOpen}>
            <GamepadIcon />
            <span>
              Choose by game
              {game && <em> · {GAMES[game].name} → {plan.name}</em>}
            </span>
            <ChevronDownIcon />
          </button>
          {gamesOpen && (
            <ul className="nd-game-list">
              {allGames.map((k) => (
                <li key={k}>
                  <button
                    className={`nd-game${game === k ? " is-active" : ""}`}
                    style={{ ["--h" as string]: GAMES[k].hue }}
                    onClick={() => pickGame(k)}
                  >
                    <span aria-hidden>{GAMES[k].glyph}</span>
                    {GAMES[k].name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Field title="Server">
          {noRegion ? (
            <p className="nd-note">No servers are online right now. Please try again shortly.</p>
          ) : (
            <div className="nd-grid3">
              {regions.map((r) => (
                <button key={r} className={`nd-opt${r === region ? " is-active" : ""}`} onClick={() => setRegion(r)} aria-pressed={r === region}>
                  {regionName(r)}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field title="Android version">
          <div className="nd-grid3">
            {versions.map((v) => (
              <button key={v} className={`nd-opt${v === android ? " is-active" : ""}`} onClick={() => setAndroidPick(v)} aria-pressed={v === android}>
                {v}
              </button>
            ))}
          </div>
          {Number(android) < 11 && <p className="nd-hint">Android {android} has no in-browser audio (requires Android 11+).</p>}
        </Field>

        {included ? (
          <Field title="Your plan">
            <div className="nd-included">
              <CheckIcon />
              <div>
                <strong>Included in your {sub!.plans.name} plan</strong>
                <span>
                  {deviceCount}/{sub!.plans.max_devices} devices used · active until {formatDate(sub!.current_period_end)}
                </span>
              </div>
            </div>
            <label className="nd-name">
              <span>Device name (optional)</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Android" maxLength={40} />
            </label>
          </Field>
        ) : (
          <Field title="Package">
            {onCurrentPlan && (
              <p className="nd-note">
                All {sub!.plans.max_devices} device slots on your {sub!.plans.name} plan are in use. Buy another rental to add a
                device.
              </p>
            )}
            <div className="nd-wallet">
              <span>
                Wallet balance: <b>{formatPrice(walletBalance, plan.currency)}</b>
              </span>
              <Link href={walletHref}>Top-up</Link>
            </div>
            <div className="nd-pkgs" role="radiogroup" aria-label="Package">
              {PACKAGES.map((pkg) => {
                const pp = packagePrice(plan, pkg.days);
                const badge = PACKAGE_BADGES[pkg.days];
                return (
                  <button
                    key={pkg.days}
                    role="radio"
                    aria-checked={days === pkg.days}
                    className={`nd-pkg${days === pkg.days ? " is-active" : ""}`}
                    onClick={() => setDays(pkg.days)}
                  >
                    {badge && <span className="nd-pkg-badge">{badge}</span>}
                    <span className="nd-pkg-name">
                      <strong>{pkg.days} days</strong>
                      <small>{formatPrice(pp.perDay, plan.currency)}/day</small>
                    </span>
                    <span className="nd-pkg-price">
                      <strong>{formatPrice(pp.total, plan.currency)}</strong>
                      {pp.discountPct > 0 && <s>{formatPrice(pp.regular, plan.currency)}</s>}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>
        )}
      </div>

      <footer className="nd-bar">
        {error && <p className="nd-error">{error}</p>}
        {!included && checkoutState?.ok && <p className="nd-success">{checkoutState.message}</p>}
        {included ? (
          <form action={createForm} className="nd-buy-form">
            <input type="hidden" name="region" value={region} />
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="android" value={android} />
            <button className="nd-buy" disabled={readOnly || pending || noRegion}>
              {creating ? "Creating…" : "Create device"}
            </button>
          </form>
        ) : walletBalance < price.total ? (
          <Link href={walletHref} className="nd-buy">
            Buy Now
          </Link>
        ) : (
          <form action={checkoutForm} className="nd-buy-form">
            <button className="nd-buy" disabled={readOnly || pending || noRegion}>
              {checkingOut ? "Paying…" : `Buy now · ${formatPrice(price.total, plan.currency)}`}
            </button>
          </form>
        )}
      </footer>
    </div>
  );
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="nd-field">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
