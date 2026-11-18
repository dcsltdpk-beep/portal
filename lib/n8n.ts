import "server-only";

/** Calls a DCS Portal API webhook in n8n (Header Auth: X-DCS-Key). */
export async function n8n<T = unknown>(path: "dcs/send-email" | "dcs/update-lead" | "dcs/lead-form", body: Record<string, unknown>): Promise<T> {
  const base = process.env.N8N_BASE_URL;
  if (!base) throw new Error("N8N_BASE_URL missing");
  const res = await fetch(`${base.replace(/\/$/, "")}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-DCS-Key": process.env.N8N_API_KEY || "" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = text;
  try { data = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(`n8n ${path} failed (${res.status}): ${text.slice(0, 200)}`);
  return data as T;
}
