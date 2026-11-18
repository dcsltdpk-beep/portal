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
      <PageTitle title={`Hello, ${s.name.split(" ")[0]}`} sub="Your Monday numbers, live." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map(([t, v, h], i) => (
          <div key={t} className={`card p-4 ${i === 6 ? "border-red-200 bg-red-50" : ""}`}>
            <p className="text-xs font-medium text-slate-500">{t}</p>
            <p className="mt-1 text-3xl font-bold">{v}</p>
            <p className="text-xs text-slate-400">{h}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card p-4 xl:col-span-2">
          <h2 className="mb-3 font-semibold">Hot leads: call today</h2>
          <LeadMiniTable leads={hot} empty="No hot leads right now." />
        </section>
        <section className="card p-4">
          <h2 className="mb-3 font-semibold">New leads by channel (7d)</h2>
          {bySource.length === 0 && <p className="text-sm text-slate-400">No leads yet.</p>}
          <div className="space-y-2">
            {bySource.map((r) => (
              <div key={r.source}>
                <div className="flex justify-between text-sm"><span className="capitalize">{r.source}</span><span className="font-semibold">{r.leads}</span></div>
                <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-brand" style={{ width: `${(r.leads / maxSrc) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
        <section className="card p-4 xl:col-span-3">
          <h2 className="mb-3 font-semibold">Follow-ups due</h2>
          <LeadMiniTable leads={followUps} empty="Nothing due." />
        </section>
      </div>
    </>
  );
}

function LeadMiniTable({ leads, empty }: { leads: Lead[]; empty: string }) {
  if (!leads.length) return <p className="text-sm text-slate-400">{empty}</p>;
  return (
    <table className="w-full">
      <tbody className="divide-y divide-slate-100">
        {leads.map((l) => (
          <tr key={l.id} className="hover:bg-slate-50">
            <td className="td"><Link href={`/leads/${l.id}`} className="font-medium text-brand hover:underline">{leadName(l)}</Link>
              <p className="text-xs text-slate-400">{l.company || l.service_interest || ""}</p></td>
            <td className="td"><StageBadge stage={l.stage} /></td>
            <td className="td"><ScoreBadge score={l.score} /></td>
            <td className="td text-xs text-slate-500">{ago(l.last_inbound_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
