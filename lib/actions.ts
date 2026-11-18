"use server";
import { revalidatePath } from "next/cache";
import { requireSession, canManageSettings } from "@/lib/auth";
import { n8n } from "@/lib/n8n";
import { q1, write } from "@/lib/db";

export type ActionState = { ok?: boolean; error?: string } | undefined;

async function assertLeadAccess(leadId: string, uid: string, role: string) {
  if (role !== "sales") return;
  const l = await q1<{ owner_id: string | null }>("select owner_id from crm.leads where id = $1", [leadId]);
  if (l?.owner_id && l.owner_id !== uid) throw new Error("This lead belongs to someone else.");
}

/** Stage / owner / follow-up / AI pause / note. Goes through n8n so the timeline is logged in one place. */
export async function updateLead(_: ActionState, form: FormData): Promise<ActionState> {
  const s = await requireSession();
  const leadId = String(form.get("lead_id"));
  try {
    await assertLeadAccess(leadId, s.uid, s.role);
    const v = (k: string) => (form.has(k) ? String(form.get(k) ?? "") : undefined);
    const followUp = v("next_follow_up");
    await n8n("dcs/update-lead", {
      lead_id: leadId,
      stage: v("stage"),
      pipeline: v("pipeline"),
      owner_id: v("owner_id"),
      next_follow_up: followUp ? new Date(followUp + ":00+05:00").toISOString() : "",
      ai_paused: form.has("ai_paused") ? form.get("ai_paused") === "true" : undefined,
      note: v("note"),
      user_id: s.uid,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/pipelines/[pipeline]", "page");
  return { ok: true };
}

/** Kanban drag & drop */
export async function moveStage(leadId: string, stage: string) {
  const s = await requireSession();
  await assertLeadAccess(leadId, s.uid, s.role);
  await n8n("dcs/update-lead", { lead_id: leadId, stage, user_id: s.uid });
  revalidatePath("/pipelines/[pipeline]", "page");
}

/** Send or reply by email through n8n (Gmail) */
export async function sendEmail(_: ActionState, form: FormData): Promise<ActionState> {
  const s = await requireSession();
  const leadId = String(form.get("lead_id") || "");
  const to = String(form.get("to") || "").trim();
  const subject = String(form.get("subject") || "").trim();
  const body = String(form.get("body") || "").trim();
  const replyTo = String(form.get("reply_to_message_id") || "");
  if (!body) return { error: "Write a message first." };
  if (!replyTo && (!to || !subject)) return { error: "To and subject are required." };
  try {
    if (leadId) await assertLeadAccess(leadId, s.uid, s.role);
    await n8n("dcs/send-email", { lead_id: leadId, to, subject, body, reply_to_message_id: replyTo, user_id: s.uid });
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (leadId) revalidatePath(`/leads/${leadId}`);
  revalidatePath("/inbox");
  return { ok: true };
}

export async function archiveEmail(form: FormData) {
  await requireSession();
  await write("update crm.emails set status = 'archived' where id = $1", [Number(form.get("id"))]);
  revalidatePath("/inbox");
}

export async function closeHandoff(form: FormData) {
  await requireSession();
  await write("update crm.handoffs set status = 'Closed', closed_at = now() where id = $1", [Number(form.get("id"))]);
  revalidatePath("/handoffs");
}

export async function saveSettings(_: ActionState, form: FormData): Promise<ActionState> {
  const s = await requireSession();
  if (!canManageSettings(s)) return { error: "Only the founder or AI specialist can change settings." };
  const hot = Number(form.get("hot_score"));
  if (!Number.isFinite(hot) || hot < 1) return { error: "Hot score must be a positive number." };
  await write("update crm.settings set value = $1 where key = 'hot_score'", [String(Math.round(hot))]);
  const alertEmail = String(form.get("alert_email") || "").trim();
  if (alertEmail) await write("update crm.settings set value = $1 where key = 'alert_email'", [alertEmail]);
  for (const [k, v] of form.entries()) {
    if (k.startsWith("rule:")) {
      const pts = Number(v);
      if (Number.isFinite(pts)) await write("update crm.scoring_rules set points = $1 where signal = $2", [Math.round(pts), k.slice(5)]);
    }
  }
  revalidatePath("/settings");
  return { ok: true };
}
