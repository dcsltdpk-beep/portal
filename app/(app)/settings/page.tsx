import { requireSession, canManageSettings } from "@/lib/auth";
import { q } from "@/lib/db";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const s = await requireSession();
  const [settings, rules, users] = await Promise.all([
    q<{ key: string; value: string }>("select key, value from crm.settings"),
    q<{ signal: string; points: number; description: string | null }>(
      "select * from crm.scoring_rules order by points desc"
    ),
    q<{ name: string; role: string; email: string; last_login_at: string | null }>(
      "select name, role, email, last_login_at from crm.users where active order by role, name"
    ),
  ]);
  const get = (k: string) => settings.find((x) => x.key === k)?.value ?? "";

  return (
    <div className="flex flex-col h-[calc(100vh-84px)] max-h-[calc(100vh-84px)] overflow-hidden space-y-2.5">
      {/* Sleek Top Header Bar */}
      <div className="shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-black text-navy-950 tracking-tight">
            System &amp; AI Settings
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.2 text-[10px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>
        <p className="text-[11px] text-slate-400 hidden sm:block">
          Lead qualification weights, webhook alerts &amp; multi-agent configuration
        </p>
      </div>

      {/* Main Grid: Left Settings + Right System Overview */}
      <div className="grid gap-3 lg:grid-cols-[1fr_330px] items-start flex-1 min-h-0 overflow-y-auto lg:overflow-hidden pr-0.5">
        {/* Left Column: Compact Settings Form */}
        <div>
          <SettingsForm
            hot={get("hot_score")}
            alertEmail={get("alert_email")}
            rules={rules}
            canEdit={canManageSettings(s)}
          />
        </div>

        {/* Right Column: Unified Team & AI Fleet Card */}
        <div className="card p-3 shadow-2xs bg-white border border-slate-200/80 space-y-3">
          {/* Section 1: Team & Access */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
              <div className="flex items-center gap-1.5">
                <svg className="h-3 w-3 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-navy-950">Team &amp; Access</h2>
              </div>
              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                {users.length} {users.length === 1 ? "User" : "Users"}
              </span>
            </div>

            <div className="space-y-1">
              {users.map((u) => (
                <div key={u.email} className="flex items-center justify-between py-1 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-navy-950 text-[10px] font-bold text-gold shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-navy-950 text-xs truncate leading-tight">{u.name}</p>
                      <p className="text-[10px] text-slate-400 truncate leading-tight">{u.email}</p>
                    </div>
                  </div>
                  <span className="rounded bg-navy-50 border border-navy-border/30 px-1.5 py-0.2 text-[9px] font-bold text-navy capitalize shrink-0">
                    {u.role.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: AI Multi-Agent Fleet */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
              <div className="flex items-center gap-1.5">
                <svg className="h-3 w-3 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-navy-950">AI Fleet</h2>
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                ● Autonomous
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1 text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/80 border border-slate-200/60">
                <div className="truncate">
                  <span className="font-bold text-navy-950 text-xs">Services B2B</span>
                  <span className="text-[9px] text-slate-400 font-mono ml-1.5">ai:services</span>
                </div>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/80 border border-slate-200/60">
                <div className="truncate">
                  <span className="font-bold text-navy-950 text-xs">Academy Training</span>
                  <span className="text-[9px] text-slate-400 font-mono ml-1.5">ai:academy</span>
                </div>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/80 border border-slate-200/60">
                <div className="truncate">
                  <span className="font-bold text-navy-950 text-xs">Client Care</span>
                  <span className="text-[9px] text-slate-400 font-mono ml-1.5">ai:care</span>
                </div>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Live Integrations Status */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-navy-950">Health &amp; Sync</h2>
              <span className="text-[9px] text-slate-400">15s Cadence</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-1 rounded bg-slate-50 border border-slate-200/60">
                <p className="text-[9px] text-slate-500 font-medium truncate">Gmail Sync</p>
                <p className="text-[10px] font-bold text-emerald-700">Live</p>
              </div>
              <div className="p-1 rounded bg-slate-50 border border-slate-200/60">
                <p className="text-[9px] text-slate-500 font-medium truncate">Postgres</p>
                <p className="text-[10px] font-bold text-emerald-700">Pool OK</p>
              </div>
              <div className="p-1 rounded bg-slate-50 border border-slate-200/60">
                <p className="text-[9px] text-slate-500 font-medium truncate">n8n Router</p>
                <p className="text-[10px] font-bold text-navy">Ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
