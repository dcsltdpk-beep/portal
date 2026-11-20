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
    <form action={action} className="space-y-2.5">
      {/* Top Action Header with Integrated Title and Save Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 px-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-950 text-gold shadow-2xs">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-navy-950">
                AI Lead Qualification &amp; Scoring Engine
              </h2>
              <span className="rounded bg-navy-50 text-navy border border-navy-border/40 px-1.5 py-0.2 text-[9px] font-bold">
                Dynamic Rules
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Weights and threshold triggers applied automatically by AI agents during lead analysis
            </p>
          </div>
        </div>

        {canEdit ? (
          <div className="flex items-center gap-2">
            {state?.ok && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Changes Saved
              </span>
            )}
            {state?.error && (
              <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-lg">
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

      {/* Core Thresholds: Hot Score & Alert Email (Sleek Horizontal Grid) */}
      <fieldset disabled={!canEdit} className="grid gap-2.5 sm:grid-cols-2">
        {/* Hot Lead Threshold Card */}
        <div className="card p-2.5 px-3.5 shadow-2xs border-l-4 border-l-amber-500 bg-white flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                🔥
              </span>
              <label className="text-xs font-bold text-navy-950 truncate">
                Hot Lead Threshold Score
              </label>
              <span className="rounded bg-amber-50 text-amber-800 border border-amber-200/80 px-1 py-0.1 text-[9px] font-bold">
                Priority Alert
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Leads scoring &ge; this trigger instant alert &amp; same-day phone call
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <input
              className="input text-xs font-black text-navy-950 py-1 px-2 w-20 text-center bg-amber-50/40 border-amber-300 focus:border-amber-500"
              type="number"
              name="hot_score"
              defaultValue={hot}
              required
            />
            <span className="text-[11px] text-slate-500 font-bold">pts</span>
          </div>
        </div>

        {/* Alert Recipient Email Card */}
        <div className="card p-2.5 px-3.5 shadow-2xs border-l-4 border-l-navy-950 bg-white flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-100 text-navy text-[11px]">
                ✉️
              </span>
              <label className="text-xs font-bold text-navy-950 truncate">
                Alert Notification Email
              </label>
              <span className="rounded bg-navy-50 text-navy border border-navy-border/40 px-1 py-0.1 text-[9px] font-bold">
                Direct Webhook
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Receives notifications for hot leads &amp; human handoffs
            </p>
          </div>

          <div className="shrink-0 w-48 sm:w-52">
            <input
              className="input text-xs font-medium py-1 px-2.5 bg-slate-50/50"
              type="email"
              name="alert_email"
              defaultValue={alertEmail}
              required
            />
          </div>
        </div>
      </fieldset>

      {/* Dynamic AI Scoring Rules in a Balanced 2-Column Grid */}
      <fieldset disabled={!canEdit} className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5 pt-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950">
              Scoring Signals &amp; Point Modifiers ({rules.length})
            </h3>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.1 text-[9px] font-bold text-slate-600">
              Live AI Weights
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Summed dynamically during lead qualification</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rules.map((r) => {
            const isNegative = r.points < 0;
            return (
              <div
                key={r.signal}
                className={`card p-2 px-3 shadow-2xs flex items-center justify-between gap-2.5 transition hover:shadow-xs ${
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
                    <p className="text-xs font-bold text-navy-950 truncate" title={r.description || ""}>
                      {r.description}
                    </p>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5 ml-3.5 truncate">
                    {r.signal}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <input
                    className={`input w-16 text-right py-0.5 px-1.5 text-xs font-black transition ${
                      isNegative
                        ? "text-rose-700 bg-rose-50/70 border-rose-200 focus:border-rose-400"
                        : "text-emerald-700 bg-emerald-50/70 border-emerald-200 focus:border-emerald-400"
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
