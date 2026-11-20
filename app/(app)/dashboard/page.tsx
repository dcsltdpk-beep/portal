import Link from "next/link";
import { requireSession, leadScope } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import { ScoreBadge, StageBadge, PageTitle } from "@/components/Badges";
import { ago, leadName } from "@/lib/format";
import type { Lead } from "@/lib/types";

type Kpis = {
  new_7d: number; hot_open: number; open_handoffs: number; emails_waiting: number;
  median_reply_min: number | null; qualified_rate: number | null; calls_7d: number;
  proposals_30d: number; won_30d: number; academy_inquiries_30d: number; enrolled_30d: number;
};

export default async function Dashboard() {
  const s = await requireSession();
  const scope = leadScope(s, "l", 1);

  const k = await q1<Kpis>(`
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
  `);

  const bySource = await q<{ source: string; leads: number }>(
    `select coalesce(source,'unknown') as source, count(*)::int as leads from crm.leads
      where created_at > now() - interval '7 days' group by 1 order by 2 desc`);

  const hot = await q<Lead>(
    `select l.* from crm.leads l where ${scope.sql}
       and l.score >= (select value::int from crm.settings where key='hot_score')
       and coalesce(l.stage,'') not in ('won','lost','enrolled')
     order by l.score desc, l.last_inbound_at desc nulls last limit 10`, scope.params);

  const followUps = await q<Lead>(
    `select l.* from crm.leads l where ${scope.sql} and l.next_follow_up <= now() + interval '1 day'
       and coalesce(l.stage,'') not in ('won','lost','enrolled')
     order by l.next_follow_up limit 10`, scope.params);

  const tiles: [string, string | number, string][] = [
    ["New leads (7d)", k?.new_7d ?? 0, "All channels"],
    ["Speed to first reply", k?.median_reply_min != null ? `${k.median_reply_min} min` : "—", "Median, 30d. Aim under 5"],
    ["Lead → qualified", k?.qualified_rate != null ? `${k.qualified_rate}%` : "—", "Services, 30d"],
    ["Calls booked (7d)", k?.calls_7d ?? 0, "Discovery + counselling"],
    ["Proposals sent / won", `${k?.proposals_30d ?? 0} / ${k?.won_30d ?? 0}`, "Last 30 days"],
    ["Inquiries → enrolled", `${k?.academy_inquiries_30d ?? 0} / ${k?.enrolled_30d ?? 0}`, "Academy, 30d"],
    ["Hot leads open", k?.hot_open ?? 0, "Call them today"],
    ["Open handoffs", k?.open_handoffs ?? 0, "Waiting for a human"],
    ["Emails waiting", k?.emails_waiting ?? 0, "New or needs a human"],
  ];
  const maxSrc = Math.max(1, ...bySource.map((r) => r.leads));

  return (
    <>
      <PageTitle title={`Hello, ${s.name.split(" ")[0]}`} sub="Live DCS CRM performance & metrics overview" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map(([t, v, h], i) => (
          <div
            key={t}
            className={`card p-5 transition hover:border-navy-border/40 hover:shadow-sm ${
              i === 6 ? "border-amber-300/80 bg-amber-50/40" : ""
            }`}
          >
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{t}</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-navy-950">{v}</p>
            <p className="mt-1 text-xs text-slate-400">{h}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-navy-950">Hot leads: call today</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Priority</span>
          </div>
          <LeadMiniTable leads={hot} empty="No hot leads right now." />
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-bold text-navy-950">Leads by channel (7d)</h2>
          <div className="space-y-3">
            {bySource.map((r) => (
              <div key={r.source}>
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span className="capitalize">{r.source}</span>
                  <span className="font-bold text-navy-950">{r.leads}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-navy transition-all duration-500"
                    style={{ width: `${(r.leads / maxSrc) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {bySource.length === 0 && <p className="text-sm text-slate-400">No leads in the last 7 days.</p>}
          </div>
        </section>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="mb-3 font-bold text-navy-950">Follow-ups due (next 24 hours)</h2>
        <LeadMiniTable leads={followUps} empty="No follow-ups due soon." showFollowUp />
      </section>
    </>
  );
}

function LeadMiniTable({ leads, empty, showFollowUp }: { leads: Lead[]; empty: string; showFollowUp?: boolean }) {
  if (leads.length === 0) return <p className="text-sm text-slate-400">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="th">Lead</th>
            <th className="th">Stage</th>
            <th className="th">Score</th>
            <th className="th">Owner</th>
            <th className="th">{showFollowUp ? "Due" : "Last message"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50/80 transition">
              <td className="td">
                <Link href={`/leads/${l.id}`} className="font-semibold text-navy hover:text-gold-dark hover:underline">
                  {leadName(l)}
                </Link>
                <p className="text-xs text-slate-400">{l.service_interest || l.company || "—"}</p>
              </td>
              <td className="td"><StageBadge stage={l.stage} /></td>
              <td className="td"><ScoreBadge score={l.score} /></td>
              <td className="td text-slate-600">{l.owner_name || <span className="text-slate-400">—</span>}</td>
              <td className="td text-xs text-slate-500">
                {showFollowUp && l.next_follow_up ? ago(l.next_follow_up) : ago(l.last_inbound_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
