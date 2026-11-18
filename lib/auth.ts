import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, verifySession, type Session } from "./session";

export async function getSession(): Promise<Session | null> {
  const c = await cookies();
  return verifySession(c.get(COOKIE)?.value);
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

/** Sales people only see leads they own (or unassigned ones). Everyone else sees all. */
export function leadScope(s: Session, alias = "l", paramIndex = 1): { sql: string; params: unknown[] } {
  if (s.role === "sales") return { sql: `(${alias}.owner_id = $${paramIndex} or ${alias}.owner_id is null)`, params: [s.uid] };
  return { sql: "true", params: [] };
}

export const canManageSettings = (s: Session) => s.role === "founder" || s.role === "ai_specialist";
