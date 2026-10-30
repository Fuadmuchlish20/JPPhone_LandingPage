import type { Metadata } from "next";
import { register } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <div className="auth-wrap">
      <AuthForm mode="register" action={register} />
    </div>
  );
}
