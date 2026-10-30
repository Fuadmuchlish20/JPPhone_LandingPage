"use client";

import { useActionState, type ReactNode } from "react";

export type ActionState = { error?: string; ok?: boolean; message?: string } | null;

/** One-button form bound to a server action `(prev, formData) => ActionState`. Pass `icon` for an icon-only button. */
export function ActionButton({
  action,
  label,
  pendingLabel,
  confirm,
  className = "btn btn-sm",
  disabled,
  icon,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  pendingLabel?: string;
  confirm?: string;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      style={{ display: "contents" }}
    >
      <button
        type="submit"
        className={className}
        disabled={pending || disabled}
        title={state?.error ?? (icon ? label : undefined)}
        aria-label={icon ? label : undefined}
        aria-busy={pending || undefined}
      >
        {icon ?? (pending ? (pendingLabel ?? `${label}…`) : label)}
      </button>
      {state?.error && !icon && <span className="form-error">{state.error}</span>}
      {state?.message && (
        <span className="muted" style={{ fontSize: 12 }}>
          {state.message}
        </span>
      )}
    </form>
  );
}
