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
      {/* Top Save Row */}
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-sm font-bold text-navy-950">Configuration</h2>
        {canEdit ? (
          <div className="flex items-center gap-2">
            {state?.ok && (
              <span className="text-xs font-semibold text-emerald-600">Saved.</span>
            )}
            {state?.error && (
              <span className="text-xs font-semibold text-red-600">{state.error}</span>
            )}
            <button
              type="submit"
              disabled={pending}
              className="btn-primary py-1.5 px-4 text-xs font-bold"
            >
              {pending ? "Saving..." : "Save changes"}
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Read-only</span>
        )}
      </div>

      {/* Core Thresholds: Hot Score & Alert Email */}
      <fieldset disabled={!canEdit} className="grid gap-3 sm:grid-cols-2">
        <div className="card p-3.5 bg-white">
          <label className="text-xs font-bold text-navy-950 block mb-1.5">
            Hot Lead Threshold
          </label>
          <div className="flex items-center gap-2">
            <input
              className="input text-sm font-bold text-navy-950 py-1.5 px-3 w-28"
              type="number"
              name="hot_score"
              defaultValue={hot}
              required
            />
            <span className="text-xs text-slate-400 font-medium">points</span>
          </div>
        </div>

        <div className="card p-3.5 bg-white">
          <label className="text-xs font-bold text-navy-950 block mb-1.5">
            Alert Email
          </label>
          <input
            className="input text-sm font-medium py-1.5 px-3"
            type="email"
            name="alert_email"
            defaultValue={alertEmail}
            required
          />
        </div>
      </fieldset>

      {/* Scoring Rules */}
      <fieldset disabled={!canEdit} className="space-y-2">
        <h3 className="text-xs font-bold text-navy-950">
          Scoring Rules ({rules.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {rules.map((r) => {
            const isNegative = r.points < 0;
            return (
              <div
                key={r.signal}
                className="card p-3 bg-white flex items-center justify-between gap-3 hover:border-slate-300 transition"
              >
                <p className="text-xs font-medium text-navy-950 leading-snug">
                  {r.description}
                </p>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    className={`input w-16 text-right py-1 px-2 text-xs font-bold ${
                      isNegative ? "text-red-600 bg-red-50/50" : "text-emerald-700 bg-emerald-50/50"
                    }`}
                    type="number"
                    name={`rule:${r.signal}`}
                    defaultValue={r.points}
                  />
                  <span className="text-xs text-slate-400">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
    </form>
  );
}
