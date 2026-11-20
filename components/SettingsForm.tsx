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
    <form action={action} className="space-y-3.5">
      {/* Top Action Header with Save Button directly visible */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-950 text-gold">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950">
              Lead Scoring &amp; Alert Engine
            </h2>
            <p className="text-[11px] text-slate-500">
              Changes apply instantly across all inbound AI evaluations.
            </p>
          </div>
        </div>

        {canEdit ? (
          <div className="flex items-center gap-2">
            {state?.ok && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Saved successfully
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
        {/* Hot Lead Threshold */}
        <div className="card p-3.5 shadow-2xs border-l-4 border-l-amber-500 hover:shadow-xs transition bg-white">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
              <span>🔥</span> Hot Lead Threshold Score
            </label>
            <span className="rounded bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
              High Priority
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <input
              className="input text-sm font-black text-navy-950 py-1 px-2.5 w-28 bg-amber-50/30 border-amber-200/80 focus:border-amber-500"
              type="number"
              name="hot_score"
              defaultValue={hot}
              required
            />
            <span className="text-xs text-slate-500 font-semibold">points required</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Leads crossing this threshold generate instant alerts and priority follow-ups.
          </p>
        </div>

        {/* Alert Recipient Email */}
        <div className="card p-3.5 shadow-2xs border-l-4 border-l-navy-950 hover:shadow-xs transition bg-white">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
              <span>✉️</span> Alert Notification Email
            </label>
            <span className="rounded bg-navy-50 border border-navy-border/40 px-1.5 py-0.2 text-[10px] font-bold text-navy">
              Direct Alerts
            </span>
          </div>

          <div className="mt-1.5">
            <input
              className="input text-xs font-medium py-1 px-2.5 bg-slate-50/50"
              type="email"
              name="alert_email"
              defaultValue={alertEmail}
              required
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Receives real-time notifications when leads turn hot or human handoffs occur.
          </p>
        </div>
      </fieldset>

      {/* Scoring Rules in a 2-Column Balanced Grid */}
      <fieldset disabled={!canEdit} className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950">
              Dynamic AI Scoring Signals
            </h3>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
              {rules.length} Active Rules
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Calculated in real-time by AI agents</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {rules.map((r) => {
            const isNegative = r.points < 0;
            return (
              <div
                key={r.signal}
                className={`card p-3 shadow-2xs flex items-center justify-between gap-3 transition hover:shadow-xs ${
                  isNegative
                    ? "border-l-4 border-l-rose-500 bg-white hover:bg-rose-50/20"
                    : "border-l-4 border-l-emerald-500 bg-white hover:bg-emerald-50/20"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        isNegative ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                    />
                    <p className="text-xs font-bold text-navy-950 leading-snug line-clamp-1" title={r.description || ""}>
                      {r.description}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 ml-3.5 truncate">
                    {r.signal}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="relative">
                    <input
                      className={`input w-20 text-right py-1 px-2 text-xs font-black transition ${
                        isNegative
                          ? "text-rose-700 bg-rose-50/70 border-rose-200 focus:border-rose-400"
                          : "text-emerald-700 bg-emerald-50/70 border-emerald-200 focus:border-emerald-400"
                      }`}
                      type="number"
                      name={`rule:${r.signal}`}
                      defaultValue={r.points}
                    />
                  </div>
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
