"use server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { q1, write } from "@/lib/db";
import { COOKIE, signSession, type Role } from "@/lib/session";

export async function login(_: { error?: string } | undefined, form: FormData) {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "/dashboard");
  const user = await q1<{ id: string; name: string; email: string; role: Role; password_hash: string | null }>(
    "select id, name, email, role, password_hash from crm.users where lower(email) = $1 and active", [email]);
  if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    return { error: "Wrong email or password." };
  }
  await write("update crm.users set last_login_at = now() where id = $1", [user.id]);
  const token = await signSession({ uid: user.id, name: user.name, email: user.email, role: user.role });
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}
