import Link from "next/link";
import { requireSession, leadScope } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import DashboardLeadTabs from "@/components/DashboardLeadTabs";
import type { Lead } from "@/lib/types";

type Kpis = {
  new_7d: number; hot_open: number; open_handoffs: number; emails_waiting: number;
  median_reply_min: number | null; qualified_rate: number | null; calls_7d: number;
  proposals_30d: number; won_30d: number; academy_inquiries_30d: number; enrolled_30d: number;
};

export default async function Dashboard() {
  const s = await requireSession();
  const scope = leadScope(s, "l", 1);

  // Execute all 4 queries concurrently in parallel to eliminate page delay
  const [k, bySource, hot, followUps] = await Promise.all([
    q1<Kpis>(`
      with hot as (select value::int v from crm.settings where key = 'hot_score')
      select
        (select count(*)::int from crm.leads where created_at > now() - interval '7 days') as new_7d,
        (select count(*)::int from crm.leads, hot where score >= hot.v and coalesce(stage,'') not in ('won','lost','enrolled')) as hot_open,
        (select count(*)::int from crm.handoffs where status = 'Open') as open_handoffs,
        (select count(*)::int from crm.emails where direction = 'in' and status in ('new','needs_human')) as emails_waiting,
        (select round(median_minutes::numeric, 1)::float from crm.v_speed_to_first_reply) as median_reply_min,
        (select round(100.0 * count(*) filter (where stage in ('qualified','call_booked','proposal_sent','negotiation','won')) / nullif(count(*),0), 1)::float
           from crm.leads where pipeline = 'services' and created_at > now() - interval '30 days') as qualified_rate,
        (select count(*)::int from crm.meetings where created_at > now() - interval '7 days') as calls_7d,
        (select count(*)::int from crm.activities where type = 'stage_change' and content like '%-> proposal_sent%' and created_at > now() - interval '30 days') as proposals_30d,
        (select count(*)::int from crm.activities where type = 'stage_change' and content like '%-> won%' and created_at > now() - interval '30 days') as won_30d,
        (select count(*)::int from crm.leads where pipeline = 'academy' and created_at > now() - interval '30 days') as academy_inquiries_30d,
        (select count(*)::int from crm.activities where type = 'stage_change' and content like '%-> enrolled%' and created_at > now() - interval '30 days') as enrolled_30d
    `),
    q<{ source: string; leads: number }>(`
      select coalesce(source,'unknown') as source, count(*)::int as leads from crm.leads
        where created_at > now() - interval '7 days' group by 1 order by 2 desc
    `),
    q<Lead>(`
      select l.*, u.name as owner_name from crm.leads l left join crm.users u on u.id = l.owner_id
        where ${scope.sql}
         and l.score >= (select value::int from crm.settings where key='hot_score')
         and coalesce(l.stage,'') not in ('won','lost','enrolled')
       order by l.score desc, l.last_inbound_at desc nulls last limit 15
    `, scope.params),
    q<Lead>(`
      select l.*, u.name as owner_name from crm.leads l left join crm.users u on u.id = l.owner_id
        where ${scope.sql} and l.next_follow_up <= now() + interval '1 day'
         and coalesce(l.stage,'') not in ('won','lost','enrolled')
       order by l.next_follow_up limit 15
    `, scope.params),
  ]);

  const maxSrc = Math.max(1, ...bySource.map((r) => r.leads));
  const qualRate = k?.qualified_rate != null ? Math.min(100, Math.max(0, k.qualified_rate)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Hero KPI Row (Inspired by modern SaaS Analytics Layout) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Featured Brand Gradient Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-900 to-navy-950 p-5 text-white shadow-md">
          {/* Subtle gold decorative gradient circle */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gold/15 blur-2xl" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gold">Inbound Volume</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-200">7 Days</span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight">{k?.new_7d ?? 0}</span>
            <span className="text-xs font-medium text-slate-300">Total Leads</span>
          </div>

          {/* Sub metrics pill row */}
          <div className="mt-4 flex items-center justify-between gap-1 border-t border-white/10 pt-3 text-[11px]">
            <div>
              <p className="text-slate-400">Calls</p>
              <p className="font-bold text-white">{k?.calls_7d ?? 0}</p>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <p className="text-slate-400">Proposals</p>
              <p className="font-bold text-white">{k?.proposals_30d ?? 0}</p>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <p className="text-slate-400">Deals Won</p>
              <p className="font-bold text-gold">{k?.won_30d ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Hot Leads Action Card */}
        <div className="card p-5 relative overflow-hidden flex flex-col justify-between hover:border-gold/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Action Today</span>
            <span className="rounded-full bg-red-50 text-red-700 border border-red-200/80 px-2 py-0.5 text-[10px] font-bold">
              Priority
            </span>
          </div>

          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-navy-950">{k?.hot_open ?? 0}</span>
              <span className="text-xs font-semibold text-amber-700">Hot Leads Open</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">High conversion score, ready for direct call</p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Open Handoffs:</span>
            <span className="font-bold text-xs text-red-600">{k?.open_handoffs ?? 0}</span>
          </div>
        </div>

        {/* Card 3: Conversion & Qualification */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Qualified Rate</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Services</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div>
              <span className="text-3xl font-extrabold tracking-tight text-navy-950">
                {k?.qualified_rate != null ? `${k.qualified_rate}%` : "—"}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Leads to Qualified (30d)</p>
            </div>

            {/* Circular Progress Meter Preview */}
            <div className="relative flex h-13 w-13 items-center justify-center rounded-full bg-navy-50 border-3 border-navy text-xs font-extrabold text-navy shadow-inner">
              {qualRate}%
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Academy Inquiries:</span>
            <span className="font-bold text-navy-950">{k?.academy_inquiries_30d ?? 0}</span>
          </div>
        </div>

        {/* Card 4: Speed to First Reply & Inbox */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Response Speed</span>
            <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">Target &lt; 5m</span>
          </div>

          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-navy-950">
                {k?.median_reply_min != null ? `${k.median_reply_min} min` : "—"}
              </span>
              <span className="text-xs font-medium text-slate-500">Median</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Automated AI + Team First Touch</p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link href="/inbox" className="font-medium text-navy hover:text-gold-dark hover:underline flex items-center gap-1">
              <span>Emails Waiting:</span>
              <span className="font-bold text-amber-700">({k?.emails_waiting ?? 0})</span>
            </Link>
            <span className="text-[10px] text-slate-400">Needs reply</span>
          </div>
        </div>
      </div>

      {/* Main Operational View: 2 Balanced Columns (Zero Excessive Vertical Scroll) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (8 cols ~ 67%): Interactive Hot Leads & Follow-ups Table */}
        <div className="lg:col-span-8 space-y-4">
          <DashboardLeadTabs hotLeads={hot} followUps={followUps} />
        </div>

        {/* Right Column (4 cols ~ 33%): Channel Breakdown & Quick Pipeline Nav */}
        <div className="lg:col-span-4 space-y-5">
          {/* Leads by Channel Card */}
          <div className="card p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950">Leads by Channel (7d)</h2>
              <span className="text-[11px] font-semibold text-slate-400">Total: {k?.new_7d ?? 0}</span>
            </div>

            <div className="space-y-3.5">
              {bySource.map((r) => {
                const pct = Math.round((r.leads / Math.max(1, k?.new_7d ?? 1)) * 100);
                return (
                  <div key={r.source} className="group">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="capitalize text-slate-700 font-semibold">{r.source}</span>
                      <span className="text-slate-500">
                        <strong className="text-navy-950">{r.leads}</strong> ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-navy to-navy-surface transition-all duration-500 group-hover:from-gold group-hover:to-gold-dark"
                        style={{ width: `${Math.min(100, Math.max(6, (r.leads / maxSrc) * 100))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {bySource.length === 0 && <p className="text-xs text-slate-400 py-3 text-center">No leads recorded yet.</p>}
            </div>
          </div>

          {/* Quick Pipelines Overview Card */}
          <div className="card p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950 border-b border-slate-100 pb-3 mb-3">
              Pipelines Overview
            </h2>
            <div className="space-y-2.5">
              <Link
                href="/pipelines/services"
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition hover:bg-navy-50 hover:border-navy-border/30 border border-slate-200/60 group"
              >
                <div>
                  <p className="text-xs font-bold text-navy-950 group-hover:text-navy">Services Pipeline (B2B)</p>
                  <p className="text-[11px] text-slate-500">Won this month: {k?.won_30d ?? 0}</p>
                </div>
                <span className="text-xs font-bold text-navy group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </Link>

              <Link
                href="/pipelines/academy"
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition hover:bg-navy-50 hover:border-navy-border/30 border border-slate-200/60 group"
              >
                <div>
                  <p className="text-xs font-bold text-navy-950 group-hover:text-navy">Academy Pipeline (B2C)</p>
                  <p className="text-[11px] text-slate-500">Enrolled this month: {k?.enrolled_30d ?? 0}</p>
                </div>
                <span className="text-xs font-bold text-navy group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
