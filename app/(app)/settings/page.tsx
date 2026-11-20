import { requireSession, canManageSettings } from "@/lib/auth";
import { q } from "@/lib/db";
import { PageTitle } from "@/components/Badges";
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
    <div className="space-y-4">
      <PageTitle
        title="CRM Settings"
        sub="Scoring weights, notification webhooks, and team access control."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px] items-start">
        {/* Left Column: Compact Settings Form */}
        <div>
          <SettingsForm
            hot={get("hot_score")}
            alertEmail={get("alert_email")}
            rules={rules}
            canEdit={canManageSettings(s)}
          />
        </div>

        {/* Right Column: Team Access + System Status Cards */}
        <div className="space-y-4">
          {/* Team Access Card */}
          <section className="card p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950">Team Access</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {users.length} {users.length === 1 ? "User" : "Users"}
              </span>
            </div>

            <ul className="divide-y divide-slate-100">
              {users.map((u) => (
                <li key={u.email} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy text-[10px] font-bold text-gold shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-navy-950 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 capitalize shrink-0 ml-2">
                    {u.role.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* System & Automation Status Card */}
          <section className="card p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950">Automation Health</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="font-semibold text-slate-700">Multi-Agent Engine</span>
                <span className="text-[10px] font-bold text-navy bg-navy-50 px-2 py-0.5 rounded border border-navy-border/30">
                  Services + Academy + Care
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="font-semibold text-slate-700">Gmail Auto-Reply</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active (Instant)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="font-semibold text-slate-700">Database Pool</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Auto-Retry Resilient
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
