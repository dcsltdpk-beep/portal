"use client";
import { useActionState } from "react";
import { saveSettings, type ActionState } from "@/lib/actions";

type Rule = { signal: string; points: number; description: string | null };

export default function SettingsForm({ hot, alertEmail, rules, canEdit }: { hot: string; alertEmail: string; rules: Rule[]; canEdit: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSettings, undefined);
  return (
    <form action={action} className="space-y-6">
      <fieldset disabled={!canEdit} className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Hot lead score (alert + call same day)</label><input className="input" type="number" name="hot_score" defaultValue={hot} /></div>
        <div><label className="label">Alert email</label><input className="input" type="email" name="alert_email" defaultValue={alertEmail} /></div>
      </fieldset>
      <fieldset disabled={!canEdit}>
        <h2 className="mb-2 font-semibold">Scoring rules</h2>
        <div className="card divide-y divide-slate-100">
          {rules.map((r) => (
            <div key={r.signal} className="flex items-center justify-between gap-4 p-3">
              <div><p className="text-sm font-medium">{r.description}</p><p className="text-xs text-slate-400">{r.signal}</p></div>
              <input className="input w-24 text-right" type="number" name={`rule:${r.signal}`} defaultValue={r.points} />
            </div>
          ))}
        </div>
      </fieldset>
      {canEdit ? (
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={pending}>{pending ? "Saving..." : "Save settings"}</button>
          {state?.ok && <span className="text-sm text-emerald-600">Saved. New scores apply on each lead&apos;s next message.</span>}
          {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        </div>
      ) : <p className="text-sm text-slate-500">Only the founder or AI specialist can change these.</p>}
    </form>
  );
}
