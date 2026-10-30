"use client";

import { useActionState } from "react";
import { walletAdjustAction } from "../actions";

export function WalletForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(walletAdjustAction.bind(null, userId), null);
  return (
    <form action={action} className="row" style={{ gap: 6 }}>
      <input name="amount" type="number" step="0.01" className="input" placeholder="+10.00" style={{ width: 90, padding: "5px 8px" }} required />
      <input name="note" className="input" placeholder="Note" maxLength={200} style={{ width: 120, padding: "5px 8px" }} />
      <button className="btn btn-sm" disabled={pending}>
        {pending ? "…" : "Apply"}
      </button>
      {state?.error && <span className="form-error">{state.error}</span>}
      {state?.ok && <span className="muted">{state.message}</span>}
    </form>
  );
}
