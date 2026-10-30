"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInWithGoogle, type AuthState } from "./actions";

export function AuthForm({
  mode,
  action,
  next,
  oauthError,
}: {
  mode: "login" | "register";
  action: (prev: AuthState, fd: FormData) => Promise<AuthState>;
  next?: string;
  oauthError?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [gState, googleAction, googlePending] = useActionState(signInWithGoogle.bind(null, next), null);
  const isLogin = mode === "login";

  return (
    <div className="card auth-card stack">
      <h2>{isLogin ? "Log in" : "Create your account"}</h2>

      <form action={googleAction}>
        <button className="btn auth-google" disabled={googlePending}>
          <GoogleLogo />
          {googlePending ? "Redirecting…" : isLogin ? "Log in with Google" : "Sign up with Google"}
        </button>
      </form>
      {(gState?.error || oauthError) && (
        <div className="alert alert-error">{gState?.error ?? "Google sign-in didn't complete. Please try again."}</div>
      )}

      <div className="auth-or" role="separator">
        <span>or with email</span>
      </div>

      <form action={formAction} className="stack">
      {next && <input type="hidden" name="next" value={next} />}
      {!isLogin && (
        <label className="field">
          Name
          <input className="input" name="display_name" autoComplete="name" />
        </label>
      )}
      <label className="field">
        Email
        <input className="input" name="email" type="email" required autoComplete="email" />
      </label>
      <label className="field">
        Password
        <input
          className="input"
          name="password"
          type="password"
          required
          minLength={isLogin ? undefined : 8}
          autoComplete={isLogin ? "current-password" : "new-password"}
        />
      </label>
      {state?.error && <div className="alert alert-error">{state.error}</div>}
      {state?.message && <div className="alert alert-info">{state.message}</div>}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
      </button>
      </form>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        {isLogin ? (
          <>
            No account? <Link href="/register">Sign up</Link>
          </>
        ) : (
          <>
            Already have an account? <Link href="/login">Log in</Link>
          </>
        )}
      </p>
    </div>
  );
}

/** Google "G" mark, as required by Google's sign-in branding guidelines. */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
