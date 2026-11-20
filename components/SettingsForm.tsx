"use client";
import { useActionState } from "react";
import { saveSettings, type ActionState } from "@/lib/actions";

type Rule = { signal: string; points: number; description: string | null };

const RULE_THEMES: Record<
  string,
  { border: string; bg: string; icon: string; inputBorder: string; inputColor: string }
> = {
  asked_price_or_call: {
    border: "border-l-4 border-l-emerald-500 border-emerald-200/90",
    bg: "bg-gradient-to-r from-emerald-50/70 via-emerald-50/20 to-white hover:from-emerald-50",
    icon: "💰",
    inputBorder: "border-emerald-300 focus:border-emerald-600",
    inputColor: "text-emerald-800 bg-white",
  },
  meeting_booked: {
    border: "border-l-4 border-l-cyan-500 border-cyan-200/90",
    bg: "bg-gradient-to-r from-cyan-50/70 via-cyan-50/20 to-white hover:from-cyan-50",
    icon: "📅",
    inputBorder: "border-cyan-300 focus:border-cyan-600",
    inputColor: "text-cyan-800 bg-white",
  },
  decision_maker: {
    border: "border-l-4 border-l-purple-500 border-purple-200/90",
    bg: "bg-gradient-to-r from-purple-50/70 via-purple-50/20 to-white hover:from-purple-50",
    icon: "👔",
    inputBorder: "border-purple-300 focus:border-purple-600",
    inputColor: "text-purple-800 bg-white",
  },
  regulated_sector: {
    border: "border-l-4 border-l-blue-500 border-blue-200/90",
    bg: "bg-gradient-to-r from-blue-50/70 via-blue-50/20 to-white hover:from-blue-50",
    icon: "🏢",
    inputBorder: "border-blue-300 focus:border-blue-600",
    inputColor: "text-blue-800 bg-white",
  },
  engaged_3plus: {
    border: "border-l-4 border-l-amber-500 border-amber-200/90",
    bg: "bg-gradient-to-r from-amber-50/70 via-amber-50/20 to-white hover:from-amber-50",
    icon: "⚡",
    inputBorder: "border-amber-300 focus:border-amber-600",
    inputColor: "text-amber-800 bg-white",
  },
  student_on_services: {
    border: "border-l-4 border-l-rose-500 border-rose-200/90",
    bg: "bg-gradient-to-r from-rose-50/70 via-rose-50/20 to-white hover:from-rose-50",
    icon: "🎓",
    inputBorder: "border-rose-300 focus:border-rose-600",
    inputColor: "text-rose-800 bg-white",
  },
};

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
      {/* Top Header with Save Button */}
      <div className="flex items-center justify-between pb-0.5">
        <h2 className="text-sm font-bold text-navy-950">Configuration</h2>
        {canEdit ? (
          <div className="flex items-center gap-2">
            {state?.ok && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs">
                ✓ Saved successfully
              </span>
            )}
            {state?.error && (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                {state.error}
              </span>
            )}
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy-950 px-4 py-1.5 text-xs font-bold text-gold border border-gold/40 shadow-xs hover:bg-navy-900 transition hover:shadow-sm"
            >
              {pending ? "Saving..." : "Save changes"}
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Read-only mode</span>
        )}
      </div>

      {/* Threshold Cards with Rich Color Themes */}
      <fieldset disabled={!canEdit} className="grid gap-3 sm:grid-cols-2">
        {/* Hot Lead Threshold (Amber Theme) */}
        <div className="card p-3.5 border border-amber-200/90 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/20 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <span>🔥</span>
              <span>Hot Lead Threshold</span>
            </label>
            <span className="rounded bg-amber-100/80 border border-amber-300 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
              Trigger
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              className="input text-sm font-black text-amber-950 py-1 px-3 w-28 bg-white border-2 border-amber-300 focus:border-amber-500 shadow-2xs"
              type="number"
              name="hot_score"
              defaultValue={hot}
              required
            />
            <span className="text-xs text-amber-900 font-bold">points</span>
          </div>
        </div>

        {/* Alert Email (Blue / Indigo Theme) */}
        <div className="card p-3.5 border border-blue-200/90 border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/20 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <span>✉️</span>
              <span>Alert Email</span>
            </label>
            <span className="rounded bg-blue-100/80 border border-blue-300 px-1.5 py-0.2 text-[10px] font-bold text-blue-900">
              Notification
            </span>
          </div>

          <div className="mt-2">
            <input
              className="input text-xs font-semibold py-1.5 px-3 bg-white border-2 border-blue-300 focus:border-blue-500 text-blue-950 shadow-2xs"
              type="email"
              name="alert_email"
              defaultValue={alertEmail}
              required
            />
          </div>
        </div>
      </fieldset>

      {/* Vibrant Color-Coded Scoring Rules */}
      <fieldset disabled={!canEdit} className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-navy-950">
            Scoring Rules ({rules.length})
          </h3>
          <span className="text-[10px] font-medium text-slate-400">
            Color-coded by intent &amp; role
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {rules.map((r) => {
            const isNegative = r.points < 0;
            const theme = RULE_THEMES[r.signal] ?? {
              border: isNegative ? "border-l-4 border-l-rose-500 border-rose-200" : "border-l-4 border-l-emerald-500 border-emerald-200",
              bg: isNegative ? "bg-gradient-to-r from-rose-50/70 to-white" : "bg-gradient-to-r from-emerald-50/70 to-white",
              icon: isNegative ? "⚠️" : "✨",
              inputBorder: isNegative ? "border-rose-300" : "border-emerald-300",
              inputColor: isNegative ? "text-rose-800 bg-white" : "text-emerald-800 bg-white",
            };

            return (
              <div
                key={r.signal}
                className={`card p-2.5 px-3 border ${theme.border} ${theme.bg} shadow-2xs flex items-center justify-between gap-3 transition hover:shadow-xs`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm shrink-0">{theme.icon}</span>
                  <p className="text-xs font-semibold text-navy-950 leading-snug truncate" title={r.description || ""}>
                    {r.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    className={`input w-16 text-right py-1 px-2 text-xs font-black border-2 ${theme.inputBorder} ${theme.inputColor} shadow-2xs`}
                    type="number"
                    name={`rule:${r.signal}`}
                    defaultValue={r.points}
                  />
                  <span className="text-xs font-bold text-slate-500">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
    </form>
  );
}
