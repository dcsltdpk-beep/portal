"use client";
import { useActionState } from "react";
import { updateLead, type ActionState } from "@/lib/actions";
import { PIPELINES, label } from "@/lib/constants";
import type { Lead, User } from "@/lib/types";

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5 * 3600 * 1000); // PKT
  return d.toISOString().slice(0, 16);
}

export default function LeadControls({ lead, users }: { lead: Lead; users: User[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateLead, undefined);
  const [noteState, noteAction, notePending] = useActionState<ActionState, FormData>(updateLead, undefined);
  const [pauseState, pauseAction, pausePending] = useActionState<ActionState, FormData>(updateLead, undefined);
  const stages = lead.pipeline === "services" || lead.pipeline === "academy" ? PIPELINES[lead.pipeline].stages : [];

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-3">
        <input type="hidden" name="lead_id" value={lead.id} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Pipeline</label>
            <select className="input" name="pipeline" defaultValue={lead.pipeline ?? ""}>
              <option value="">Unsorted</option><option value="services">Services</option><option value="academy">Academy</option><option value="client">Client</option>
            </select>
          </div>
          <div>
            <label className="label">Stage</label>
            <select className="input" name="stage" defaultValue={lead.stage ?? ""}>
              <option value="">—</option>
              {stages.map((st) => <option key={st} value={st}>{label(st)}</option>)}
              {lead.pipeline === "client" && <><option value="active">Active client</option><option value="support">Support</option></>}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Owner</label>
          <select className="input" name="owner_id" defaultValue={lead.owner_id ?? ""}>
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role.replace("_", " ")})</option>)}
          </select>
        </div>
        <div>
          <label className="label">Next follow-up (PKT)</label>
          <input className="input" type="datetime-local" name="next_follow_up" defaultValue={toLocalInput(lead.next_follow_up)} />
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={pending}>{pending ? "Saving..." : "Save"}</button>
          {state?.ok && <span className="text-sm text-emerald-600">Saved.</span>}
          {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        </div>
      </form>

      <form action={pauseAction} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
        <input type="hidden" name="lead_id" value={lead.id} />
        <input type="hidden" name="ai_paused" value={lead.ai_paused ? "false" : "true"} />
        <div>
          <p className="text-sm font-medium">{lead.ai_paused ? "AI is paused" : "AI is replying"}</p>
          <p className="text-xs text-slate-500">{lead.ai_paused ? "Your team handles this lead." : "Pause when a person takes over."}</p>
        </div>
        <button className="btn-ghost" disabled={pausePending}>{lead.ai_paused ? "Resume AI" : "Pause AI"}</button>
        {pauseState?.error && <span className="text-sm text-red-600">{pauseState.error}</span>}
      </form>

      <form action={noteAction} className="space-y-2">
        <input type="hidden" name="lead_id" value={lead.id} />
        <label className="label">Add a note</label>
        <textarea className="input" name="note" rows={3} placeholder="Call summary, objections, next steps..." required />
        <div className="flex items-center gap-3">
          <button className="btn-ghost" disabled={notePending}>{notePending ? "Adding..." : "Add note"}</button>
          {noteState?.ok && <span className="text-sm text-emerald-600">Added.</span>}
          {noteState?.error && <span className="text-sm text-red-600">{noteState.error}</span>}
        </div>
      </form>
    </div>
  );
}
