import type { Metadata } from "next";
import { login } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <div className="auth-wrap">
      <AuthForm mode="login" action={login} next={next} oauthError={error === "oauth"} />
    </div>
  );
}
