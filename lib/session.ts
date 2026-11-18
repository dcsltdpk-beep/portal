import { SignJWT, jwtVerify } from "jose";

export type Role = "founder" | "sales" | "ai_specialist" | "content" | "developer";
export type Session = { uid: string; name: string; email: string; role: Role };

export const COOKIE = "dcs_session";
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-change-me");

export async function signSession(s: Session) {
  return new SignJWT(s).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key());
}

export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}
