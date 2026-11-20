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
    <div className="space-y-4">
      {/* Simple Page Header */}
      <div>
        <h1 className="text-xl font-bold text-navy-950">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage lead qualification rules and team notifications.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px] items-start">
        {/* Left Column: Settings Form */}
        <div>
          <SettingsForm
            hot={get("hot_score")}
            alertEmail={get("alert_email")}
            rules={rules}
            canEdit={canManageSettings(s)}
          />
        </div>

        {/* Right Column: Clean Team & Status */}
        <div className="space-y-4">
          {/* Team Access */}
          <div className="card p-4 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-navy-950">Team</h2>
              <span className="text-xs text-slate-400">
                {users.length} {users.length === 1 ? "user" : "users"}
              </span>
            </div>

            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.email} className="flex items-center justify-between text-xs">
                  <div className="truncate">
                    <p className="font-semibold text-navy-950 truncate">{u.name}</p>
                    <p className="text-slate-400 truncate text-[11px]">{u.email}</p>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 capitalize shrink-0 ml-2">
                    {u.role.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="card p-4 bg-white space-y-2.5">
            <h2 className="text-xs font-bold text-navy-950 border-b border-slate-100 pb-2">
              System Status
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">AI Agents</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Gmail Sync</span>
                <span className="font-semibold text-emerald-600">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Database</span>
                <span className="font-semibold text-emerald-600">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
