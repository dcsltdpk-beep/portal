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
    <div className="flex flex-col gap-2.5 max-h-[calc(100vh-80px)] overflow-hidden">
      {/* Top Header Bar */}
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
          DCS multi-agent qualification weights, alert webhooks &amp; infrastructure control
        </p>
      </div>

      {/* Main Upper Grid: Left Settings + Right Team & Access */}
      <div className="grid gap-2.5 lg:grid-cols-[1fr_320px] items-start shrink-0">
        {/* Left Column: Settings Form */}
        <div>
          <SettingsForm
            hot={get("hot_score")}
            alertEmail={get("alert_email")}
            rules={rules}
            canEdit={canManageSettings(s)}
          />
        </div>

        {/* Right Column: Team Access & Portal Security */}
        <div className="card p-3 shadow-2xs bg-white border border-slate-200/80 space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950">Team &amp; Access Control</h2>
            </div>
            <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded-full">
              {users.length} {users.length === 1 ? "Active User" : "Active Users"}
            </span>
          </div>

          {/* User List */}
          <div className="space-y-1.5">
            {users.map((u) => (
              <div key={u.email} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-950 text-[10px] font-black text-gold shrink-0 shadow-2xs">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1">
                      <p className="font-bold text-navy-950 text-xs truncate leading-tight">{u.name}</p>
                      <span className="text-[8px] text-emerald-600 font-bold" title="Online & Active">●</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate leading-tight">{u.email}</p>
                  </div>
                </div>
                <span className="rounded bg-navy-50 border border-navy-border/40 px-2 py-0.5 text-[9px] font-bold text-navy capitalize shrink-0 ml-1">
                  {u.role.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>

          {/* Security & Access Policies Summary */}
          <div className="pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] text-slate-500 py-0.5">
              <span>Authentication</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.1 rounded border border-emerald-200">
                HttpOnly Cookie + RBAC
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 py-0.5">
              <span>Session Policy</span>
              <span className="font-mono text-slate-700 font-bold">14-Day Sliding</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 py-0.5">
              <span>PostgreSQL Connection</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.1 rounded border border-emerald-200">
                SSL Auto-Pool
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 3-Card Infrastructure & AI Fleet Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 shrink-0">
        {/* Card 1: AI Multi-Agent Fleet Status */}
        <div className="card p-2.5 px-3 bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
            <div className="flex items-center gap-1.5">
              <svg className="h-3 w-3 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-navy-950">
                AI Multi-Agent Fleet
              </h3>
            </div>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.1 rounded">
              3 Active
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between p-1 px-1.5 rounded bg-slate-50 border border-slate-100">
              <div className="truncate">
                <span className="font-bold text-navy-950 text-[11px]">Services B2B</span>
                <span className="text-[9px] text-slate-400 font-mono ml-1">ai:services</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.1 rounded">
                Deals &amp; Quotes
              </span>
            </div>

            <div className="flex items-center justify-between p-1 px-1.5 rounded bg-slate-50 border border-slate-100">
              <div className="truncate">
                <span className="font-bold text-navy-950 text-[11px]">Academy Training</span>
                <span className="text-[9px] text-slate-400 font-mono ml-1">ai:academy</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.1 rounded">
                Admissions
              </span>
            </div>

            <div className="flex items-center justify-between p-1 px-1.5 rounded bg-slate-50 border border-slate-100">
              <div className="truncate">
                <span className="font-bold text-navy-950 text-[11px]">Client Care</span>
                <span className="text-[9px] text-slate-400 font-mono ml-1">ai:care</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.1 rounded">
                Triage &amp; FAQ
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Channel Gateways & Webhooks */}
        <div className="card p-2.5 px-3 bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
            <div className="flex items-center gap-1.5">
              <svg className="h-3 w-3 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-navy-950">
                Channel Gateways
              </h3>
            </div>
            <span className="text-[9px] font-bold text-navy bg-navy-50 border border-navy-border/40 px-1.5 py-0.1 rounded">
              Omnichannel
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between p-1 px-1.5 rounded bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-navy-950 text-[11px]">Gmail API</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.1 rounded border border-emerald-200">
                Live (15s cadence)
              </span>
            </div>

            <div className="flex items-center justify-between p-1 px-1.5 rounded bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="font-bold text-navy-950 text-[11px]">WhatsApp Cloud</span>
              </div>
              <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.1 rounded border border-amber-200">
                Webhook Ready
              </span>
            </div>

            <div className="flex items-center justify-between p-1 px-1.5 rounded bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span className="font-bold text-navy-950 text-[11px]">Meta / Instagram</span>
              </div>
              <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1 py-0.1 rounded">
                Graph API Planned
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Lead Routing & SLA Guardrails */}
        <div className="card p-2.5 px-3 bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
            <div className="flex items-center gap-1.5">
              <svg className="h-3 w-3 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-navy-950">
                Automation Guardrails
              </h3>
            </div>
            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.1 rounded">
              Active SLA
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between p-1 px-1.5 rounded bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-600 font-medium">Hot Lead Escalation</span>
              <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.1 rounded">
                &ge; {get("hot_score") || "50"} pts &rarr; Call Today
              </span>
            </div>

            <div className="flex items-center justify-between p-1 px-1.5 rounded bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-600 font-medium">AI Auto-Reply SLA</span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.1 rounded">
                &lt; 5m Instant Delivery
              </span>
            </div>

            <div className="flex items-center justify-between p-1 px-1.5 rounded bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-600 font-medium">Human Handoff Trigger</span>
              <span className="text-[9px] font-bold text-navy bg-navy-50 px-1 py-0.1 rounded">
                Auto-Triage Queue
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
