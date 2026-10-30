"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ActionState } from "@/components/ui/action-button";
import type { RedeemKind } from "@/lib/db-types";
import { AccountShell } from "../account-shell";
import { CheckIcon } from "../icons";
import { redeemCodeAction } from "./actions";

const CARDS: { kind: RedeemKind; title: string; body: string; tone: "lime" | "dark" }[] = [
  { kind: "plan", title: "Add New Cloud Phone", body: "Activate a plan with a code, then create your device.", tone: "lime" },
  { kind: "renew", title: "Renew Cloud Phone", body: "Add days to your current plan. All your devices are extended.", tone: "dark" },
];

export function RedeemView({
  initial,
  backHref,
  newHref = "/dashboard/new",
  readOnly,
}: {
  initial?: RedeemKind;
  backHref?: string;
  newHref?: string;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState<RedeemKind | null>(initial ?? null);

  return (
    <AccountShell title="Redeem Code" backHref={backHref}>
      <div className="rc">
        {CARDS.map((c) => (
          <section key={c.kind} className={`rc-card rc-${c.tone}${open === c.kind ? " is-open" : ""}`}>
            <button className="rc-head" onClick={() => setOpen(open === c.kind ? null : c.kind)} aria-expanded={open === c.kind}>
              <span className="rc-title">{c.title}</span>
              <span className="rc-body">{c.body}</span>
              <span className="rc-tiles" aria-hidden>
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            </button>
            {open === c.kind && <RedeemForm kind={c.kind} newHref={newHref} readOnly={readOnly} />}
          </section>
        ))}
        <p className="rc-help">
          Codes look like <code>ABCD-EFGH-JKLM-NPQR</code>. Each code can be used once per account.
        </p>
      </div>
    </AccountShell>
  );
}

function RedeemForm({ kind, newHref, readOnly }: { kind: RedeemKind; newHref: string; readOnly?: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(redeemCodeAction.bind(null, kind), null);

  if (state?.ok) {
    return (
      <div className="rc-form rc-done" role="status">
        <CheckIcon />
        <div>
          <strong>Code redeemed</strong>
          <span>{state.message}</span>
        </div>
        {kind === "plan" ? (
          <Link href={newHref} className="rc-btn">
            Create device
          </Link>
        ) : (
          <Link href="/dashboard" className="rc-btn">
            My devices
          </Link>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="rc-form">
      <label className="sr-only" htmlFor={`code-${kind}`}>
        Redeem code
      </label>
      <input
        id={`code-${kind}`}
        name="code"
        placeholder="Enter your code"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={40}
        required
        autoFocus
      />
      <button className="rc-btn" disabled={pending || readOnly}>
        {pending ? "Checking…" : "Redeem"}
      </button>
      {state?.error && <p className="rc-error">{state.error}</p>}
    </form>
  );
}
