"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ActionButton, type ActionState } from "@/components/ui/action-button";
import type { WalletTopupRow } from "@/lib/db-types";
import { formatDate, formatPrice } from "@/lib/format";
import { PAYMENT_METHODS, TOPUP_MAX, TOPUP_MIN, TOPUP_PRESETS, bonusFor, roundMoney } from "@/lib/wallet/topup";
import { AccountShell } from "../../account-shell";
import { CheckIcon } from "../../icons";
import { cancelTopupAction, createTopupAction } from "../actions";

const usd = (n: number) => formatPrice(n, "USD");

export function TopupView({
  balance,
  pending,
  supportHref,
  walletHref = "/dashboard/wallet",
  backHref = "/dashboard/wallet",
  readOnly,
}: {
  balance: number;
  pending: WalletTopupRow[];
  supportHref: string;
  walletHref?: string;
  backHref?: string;
  readOnly?: boolean;
}) {
  const [preset, setPreset] = useState<number | null>(TOPUP_PRESETS[0]!.amount);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]!.id);

  const amount = preset ?? roundMoney(Number(custom));
  const valid = Number.isFinite(amount) && amount >= TOPUP_MIN && amount <= TOPUP_MAX;
  const bonus = preset ? bonusFor(preset) : 0;

  const [state, action, submitting] = useActionState<ActionState, FormData>(
    (prev, fd) => createTopupAction(amount, method, prev, fd),
    null,
  );
  const methodName = PAYMENT_METHODS.find((m) => m.id === method)?.name ?? method;

  return (
    <AccountShell
      title="Top-up"
      backHref={backHref}
      actions={
        <Link href={walletHref} className="tp-history">
          Transaction History
        </Link>
      }
    >
      <div className="tp">
        <div className="tp-balance">
          <span className="pf-label">
            Wallet Balance
            <span className="pf-help" title="Use your balance to buy or renew plans.">
              ?
            </span>
          </span>
          <strong>{usd(balance)}</strong>
        </div>

        {state?.ok ? (
          <section className="tp-done" role="status">
            <CheckIcon />
            <div>
              <strong>Top-up created</strong>
              <span>
                Pay <b>{usd(amount)}</b> with {methodName} and send your reference to customer service. Your balance
                {bonus > 0 ? ` (+${usd(bonus)} bonus)` : ""} is added as soon as the payment is confirmed.
              </span>
              <code className="tp-ref">{state.message}</code>
            </div>
            <div className="tp-done-actions">
              <a href={supportHref} className="dd-new" target={supportHref.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                Contact customer service
              </a>
              <Link href={walletHref} className="vd-more-btn">
                Back to wallet
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section>
              <h2 className="tp-h">Top-up Amount</h2>
              <div className="tp-amounts" role="radiogroup" aria-label="Top-up amount">
                {TOPUP_PRESETS.map((p) => (
                  <button
                    key={p.amount}
                    role="radio"
                    aria-checked={preset === p.amount}
                    className={`tp-amount${preset === p.amount ? " is-active" : ""}`}
                    onClick={() => setPreset(p.amount)}
                  >
                    <span className="tp-price">
                      <small>$</small>
                      {p.amount.toFixed(2)}
                    </span>
                    {p.bonus > 0 && <span className="tp-bonus">Bonus {usd(p.bonus)}</span>}
                  </button>
                ))}
                <label className={`tp-amount tp-custom${preset === null ? " is-active" : ""}`}>
                  <span className="tp-price">
                    <small>$</small>
                  </span>
                  <input
                    inputMode="decimal"
                    placeholder="Custom Amount"
                    value={custom}
                    onFocus={() => setPreset(null)}
                    onChange={(e) => {
                      setPreset(null);
                      setCustom(e.target.value.replace(/[^\d.]/g, ""));
                    }}
                    aria-label={`Custom amount, ${TOPUP_MIN} to ${TOPUP_MAX} dollars`}
                  />
                </label>
              </div>
              {preset === null && custom && !valid && (
                <p className="rc-error">
                  Enter between {usd(TOPUP_MIN)} and {usd(TOPUP_MAX)}.
                </p>
              )}
            </section>

            <section>
              <h2 className="tp-h">Method</h2>
              <div className="tp-methods" role="radiogroup" aria-label="Payment method">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    role="radio"
                    aria-checked={method === m.id}
                    className={`tp-method${method === m.id ? " is-active" : ""}`}
                    style={{ ["--c" as string]: m.color }}
                    onClick={() => setMethod(m.id)}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </section>

            {pending.length > 0 && (
              <section>
                <h2 className="tp-h">Waiting for payment</h2>
                <ul className="ac-list">
                  {pending.map((t) => (
                    <li key={t.id} className="ac-item">
                      <div className="ac-item-main">
                        <strong>
                          {usd(Number(t.amount))}
                          {Number(t.bonus) > 0 && <span className="tp-bonus"> +{usd(Number(t.bonus))}</span>}
                        </strong>
                        <span>
                          <code>{t.reference}</code> · {PAYMENT_METHODS.find((m) => m.id === t.method)?.name ?? t.method} · {formatDate(t.created_at)}
                        </span>
                      </div>
                      <ActionButton action={cancelTopupAction.bind(null, t.id)} label="Cancel" className="ms-link" disabled={readOnly} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      {!state?.ok && (
        <footer className="tp-bar">
          {state?.error && <p className="nd-error">{state.error}</p>}
          <form action={action} style={{ display: "contents" }}>
            <button className="tp-confirm" disabled={!valid || submitting || readOnly}>
              {submitting ? "Creating…" : valid ? `Confirm payment ${usd(amount)}` : "Enter an amount"}
            </button>
          </form>
        </footer>
      )}
    </AccountShell>
  );
}
