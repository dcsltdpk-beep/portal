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
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-navy-950 tracking-tight">System &amp; AI Settings</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Configure lead qualification scoring, instant alert thresholds, and multi-agent AI parameters.
          </p>
        </div>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1fr_340px] items-start">
        {/* Left Column: Settings Form */}
        <div>
          <SettingsForm
            hot={get("hot_score")}
            alertEmail={get("alert_email")}
            rules={rules}
            canEdit={canManageSettings(s)}
          />
        </div>

        {/* Right Column: Team Access + AI Agent Architecture + System Health */}
        <div className="space-y-3">
          {/* Team Access Card */}
          <section className="card p-3.5 shadow-2xs bg-white border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950">Team &amp; Access</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-bold text-slate-600">
                {users.length} {users.length === 1 ? "Active User" : "Active Users"}
              </span>
            </div>

            <ul className="divide-y divide-slate-100">
              {users.map((u) => (
                <li key={u.email} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-950 text-[10px] font-bold text-gold shrink-0 shadow-2xs">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-navy-950 truncate">{u.name}</p>
                        <span className="text-[10px] text-emerald-600" title="Active">●</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-navy-50 border border-navy-border/30 px-2 py-0.5 text-[10px] font-bold text-navy capitalize shrink-0 ml-2">
                    {u.role.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* AI Multi-Agent Routing Status */}
          <section className="card p-3.5 shadow-2xs bg-white border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950">AI Agent Fleet</h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Autonomous
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-200/60">
                <div>
                  <p className="font-bold text-navy-950 text-[11px]">Services B2B Agent</p>
                  <p className="text-[10px] text-slate-400 font-mono">ai:services</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Auto-Replies Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-200/60">
                <div>
                  <p className="font-bold text-navy-950 text-[11px]">Academy Training Agent</p>
                  <p className="text-[10px] text-slate-400 font-mono">ai:academy</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Courses &amp; Admissions
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-200/60">
                <div>
                  <p className="font-bold text-navy-950 text-[11px]">Client Care Agent</p>
                  <p className="text-[10px] text-slate-400 font-mono">ai:care</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Triage &amp; Inquiries
                </span>
              </div>
            </div>
          </section>

          {/* Infrastructure Health */}
          <section className="card p-3.5 shadow-2xs bg-white border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950">Integration Health</h2>
              <span className="text-[10px] font-bold text-slate-400">Live Cadence 15s</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-700">Gmail OAuth Sync</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-700">Railway PostgreSQL</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                  Auto-Retry Pool
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-700">n8n Multi-Agent Router</span>
                <span className="text-[10px] font-bold text-navy bg-navy-50 px-2 py-0.2 rounded border border-navy-border/40">
                  Ready &amp; Scalable
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
