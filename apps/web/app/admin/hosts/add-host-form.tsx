"use client";

import { useActionState } from "react";
import { addHostAction } from "../actions";

export function AddHostForm() {
  const [state, action, pending] = useActionState(addHostAction, null);
  return (
    <form action={action} className="card stack">
      <h3>Add host</h3>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <label className="field" style={{ flex: "1 1 120px" }}>
          Name
          <input className="input" name="name" placeholder="host1" required />
        </label>
        <label className="field" style={{ flex: "1 1 90px" }}>
          Region
          <input className="input" name="region" placeholder="sg" required />
        </label>
        <label className="field" style={{ flex: "2 1 240px" }}>
          Public URL
          <input className="input" name="public_url" placeholder="https://host1.jpphone.com" required />
        </label>
        <label className="field" style={{ flex: "0 1 100px" }}>
          Capacity
          <input className="input" name="capacity" type="number" min={1} defaultValue={12} required />
        </label>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {state?.error && <div className="alert alert-error">{state.error}</div>}
    </form>
  );
}
