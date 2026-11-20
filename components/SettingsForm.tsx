"use client";
import { useActionState } from "react";
import { saveSettings, type ActionState } from "@/lib/actions";

type Rule = { signal: string; points: number; description: string | null };

export default function SettingsForm({
  hot,
  alertEmail,
  rules,
  canEdit,
}: {
  hot: string;
  alertEmail: string;
  rules: Rule[];
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSettings, undefined);

  return (
    <form action={action} className="space-y-4">
      {/* Top Action Header with Save Button directly visible without scrolling */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy-950">System Configuration</h2>
          <p className="text-xs text-slate-500">Fine-tune automated lead qualification scores and team alerts.</p>
        </div>
        {canEdit ? (
          <div className="flex items-center gap-2.5">
            {state?.ok && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                ✓ Saved successfully
              </span>
            )}
            {state?.error && (
              <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                {state.error}
              </span>
            )}
            <button
              type="submit"
              disabled={pending}
              className="btn-primary py-1.5 px-4 text-xs font-bold shadow-xs hover:shadow-sm"
            >
              {pending ? "Saving..." : "Save changes"}
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Read-only mode</span>
        )}
      </div>

      {/* Core Thresholds: Hot Score & Alert Email */}
      <fieldset disabled={!canEdit} className="grid gap-3 sm:grid-cols-2">
        <div className="card p-3.5 shadow-2xs">
          <label className="text-xs font-bold text-navy-950 block mb-1">
            Hot Lead Threshold Score
          </label>
          <div className="flex items-center gap-2">
            <input
              className="input text-sm font-bold text-navy-950 py-1.5"
              type="number"
              name="hot_score"
              defaultValue={hot}
              required
            />
            <span className="text-xs text-slate-400 shrink-0 font-medium">points</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Triggers immediate human alert &amp; same-day call</p>
        </div>

        <div className="card p-3.5 shadow-2xs">
          <label className="text-xs font-bold text-navy-950 block mb-1">
            Alert Recipient Email
          </label>
          <input
            className="input text-sm font-medium py-1.5"
            type="email"
            name="alert_email"
            defaultValue={alertEmail}
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">Receives instant notifications for hot leads &amp; handoffs</p>
        </div>
      </fieldset>

      {/* Scoring Rules in a 2-Column Balanced Grid */}
      <fieldset disabled={!canEdit} className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950">
            Scoring Rules ({rules.length})
          </h3>
          <span className="text-[11px] text-slate-400">Points applied dynamically by AI</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {rules.map((r) => {
            const isNegative = r.points < 0;
            return (
              <div
                key={r.signal}
                className="card p-3 shadow-2xs flex items-center justify-between gap-3 hover:border-gold/50 transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-navy-950 leading-snug truncate" title={r.description || ""}>
                    {r.description}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{r.signal}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    className={`input w-20 text-right py-1 px-2 text-xs font-bold ${
                      isNegative ? "text-red-600 bg-red-50/50" : "text-emerald-700 bg-emerald-50/50"
                    }`}
                    type="number"
                    name={`rule:${r.signal}`}
                    defaultValue={r.points}
                  />
                  <span className="text-[10px] text-slate-400 font-semibold">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
    </form>
  );
}
