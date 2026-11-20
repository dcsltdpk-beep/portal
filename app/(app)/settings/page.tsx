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
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-black text-navy-950 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure lead scoring rules and notification preferences.
        </p>
      </div>

      {/* Main Grid: Left Settings Form + Right Team */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px] items-start">
        {/* Left Column: Settings Form */}
        <div>
          <SettingsForm
            hot={get("hot_score")}
            alertEmail={get("alert_email")}
            rules={rules}
            canEdit={canManageSettings(s)}
          />
        </div>

        {/* Right Column: Colorful Team Card */}
        <div>
          <div className="card p-4 border-t-4 border-t-gold border-slate-200/90 bg-gradient-to-b from-navy-50/40 via-white to-white shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">👥</span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950">Team</h2>
              </div>
              <span className="rounded-full bg-navy-950 text-gold px-2 py-0.5 text-[10px] font-bold shadow-2xs">
                {users.length} {users.length === 1 ? "user" : "users"}
              </span>
            </div>

            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.email} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-950 text-[11px] font-black text-gold ring-2 ring-gold/40 shadow-xs shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-navy-950 truncate">{u.name}</p>
                      <p className="text-slate-400 truncate text-[11px]">{u.email}</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-gold/15 text-navy-950 border border-gold/40 px-2 py-0.5 text-[10px] font-bold capitalize shrink-0 ml-2">
                    {u.role.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
