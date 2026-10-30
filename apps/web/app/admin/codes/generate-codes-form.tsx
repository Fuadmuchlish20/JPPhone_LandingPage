"use client";

import { useActionState, useState } from "react";
import type { PlanRow } from "@/lib/db-types";
import { generateCodesAction } from "../actions";

export function GenerateCodesForm({ plans }: { plans: PlanRow[] }) {
  const [state, action, pending] = useActionState(generateCodesAction, null);
  const [kind, setKind] = useState<"plan" | "renew">("plan");

  return (
    <form action={action} className="card stack">
      <h3 style={{ margin: 0 }}>Generate codes</h3>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <label className="field" style={{ flex: "1 1 160px" }}>
          Type
          <select className="input" name="kind" value={kind} onChange={(e) => setKind(e.target.value as "plan" | "renew")}>
            <option value="plan">Add new cloud phone (activates plan)</option>
            <option value="renew">Renew cloud phone (adds days)</option>
          </select>
        </label>
        <label className="field" style={{ flex: "1 1 140px" }}>
          Plan
          <select className="input" name="plan_id" required={kind === "plan"} defaultValue="">
            {kind === "renew" && <option value="">Any plan</option>}
            {kind === "plan" && (
              <option value="" disabled>
                Choose…
              </option>
            )}
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field" style={{ flex: "0 1 100px" }}>
          Days
          <input className="input" name="days" type="number" min={1} max={3650} defaultValue={30} required />
        </label>
        <label className="field" style={{ flex: "0 1 100px" }}>
          Quantity
          <input className="input" name="quantity" type="number" min={1} max={500} defaultValue={1} required />
        </label>
        <label className="field" style={{ flex: "0 1 110px" }}>
          Uses / code
          <input className="input" name="max_uses" type="number" min={1} defaultValue={1} required />
        </label>
        <label className="field" style={{ flex: "0 1 160px" }}>
          Expires (optional)
          <input className="input" name="expires_at" type="date" />
        </label>
        <label className="field" style={{ flex: "1 1 180px" }}>
          Note
          <input className="input" name="note" maxLength={200} placeholder="e.g. Giveaway Nov" />
        </label>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Generating…" : "Generate"}
        </button>
      </div>
      {state?.error && <div className="alert alert-error">{state.error}</div>}
      {state?.ok && state.message && (
        <label className="field">
          New codes — copy them now
          <textarea className="input" readOnly rows={Math.min(10, state.message.split("\n").length)} value={state.message} style={{ fontFamily: "var(--mono)" }} />
        </label>
      )}
    </form>
  );
}
