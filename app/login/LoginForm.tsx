"use client";
import { useActionState } from "react";
import { login } from "./actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div><label className="label">Email</label><input className="input" name="email" type="email" required autoFocus /></div>
      <div><label className="label">Password</label><input className="input" name="password" type="password" required /></div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-primary w-full py-2" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}
