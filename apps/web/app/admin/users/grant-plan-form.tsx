"use client";

import { useActionState } from "react";
import type { PlanRow } from "@/lib/db-types";
import { grantPlanAction } from "../actions";

export function GrantPlanForm({ userId, plans }: { userId: string; plans: PlanRow[] }) {
  const [state, action, pending] = useActionState(grantPlanAction.bind(null, userId), null);
  return (
    <form action={action} className="row" style={{ gap: 6 }}>
      <select name="plan_id" className="input" style={{ width: "auto", padding: "5px 8px" }} required>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.period_days}d)
          </option>
        ))}
      </select>
      <button className="btn btn-sm" disabled={pending}>
        {pending ? "…" : "Grant"}
      </button>
      {state?.error && <span className="form-error">{state.error}</span>}
      {state?.ok && <span className="muted">Done</span>}
    </form>
  );
}
