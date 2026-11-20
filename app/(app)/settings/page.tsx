import { requireSession, canManageSettings } from "@/lib/auth";
import { q } from "@/lib/db";
import { PageTitle } from "@/components/Badges";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const s = await requireSession();
  const [settings, rules, users] = await Promise.all([
    q<{ key: string; value: string }>("select key, value from crm.settings"),
    q<{ signal: string; points: number; description: string | null }>("select * from crm.scoring_rules order by points desc"),
    q<{ name: string; role: string; email: string; last_login_at: string | null }>(
      "select name, role, email, last_login_at from crm.users where active order by role, name"
    ),
  ]);
  const get = (k: string) => settings.find((x) => x.key === k)?.value ?? "";
  return (
    <>
      <PageTitle title="Settings" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <SettingsForm hot={get("hot_score")} alertEmail={get("alert_email")} rules={rules} canEdit={canManageSettings(s)} />
        <section className="card h-fit p-4">
          <h2 className="mb-2 font-semibold">Team</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {users.map((u) => (
              <li key={u.email} className="flex justify-between py-2"><span>{u.name}<span className="block text-xs text-slate-400">{u.email}</span></span>
                <span className="text-xs capitalize text-slate-500">{u.role.replace("_", " ")}</span></li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400">Add people with SQL (see README). Hash passwords with npm run hash.</p>
        </section>
      </div>
    </>
  );
}
