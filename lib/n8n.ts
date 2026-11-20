import "server-only";

/** Calls a DCS Portal API webhook in n8n (Header Auth: X-DCS-Key). */
export async function n8n<T = unknown>(path: "dcs/send-email" | "dcs/update-lead" | "dcs/lead-form", body: Record<string, unknown>): Promise<T> {
  const base = process.env.N8N_BASE_URL || process.env.N8N_BASE_UR;
  if (!base || base.includes("yourdomain.com")) {
    throw new Error("n8n Webhook URL configure nahi hai (Vercel Environment Variables me N8N_BASE_URL placeholder hai ya missing hai). Please check Vercel Settings.");
  }

  let res: Response;
  try {
    res = await fetch(`${base.replace(/\/$/, "")}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-DCS-Key": process.env.N8N_API_KEY || "" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err: unknown) {
    throw new Error(`n8n webhook se connect nahi ho saka (${base}). Check karein ke n8n instance online hai.`);
  }

  const text = await res.text();
  let data: unknown = text;
  try { data = JSON.parse(text); } catch { }
  if (!res.ok) throw new Error(`n8n ${path} failed (${res.status}): ${text.slice(0, 200)}`);
  return data as T;
}
