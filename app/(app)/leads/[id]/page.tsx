import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import { ScoreBadge, StageBadge, TempBadge } from "@/components/Badges";
import EmailComposer from "@/components/EmailComposer";
import LeadControls from "@/components/LeadControls";
import { fmtDate, leadName } from "@/lib/format";
import type { Activity, Email, Lead, User } from "@/lib/types";

export default async function LeadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const { tab = "timeline" } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const lead = await q1<Lead>(
    "select l.*, u.name as owner_name from crm.leads l left join crm.users u on u.id = l.owner_id where l.id = $1", [id]);
  if (!lead) notFound();
  if (s.role === "sales" && lead.owner_id && lead.owner_id !== s.uid) notFound();

  const [activities, emails, meetings, handoffs, users] = await Promise.all([
    q<Activity>("select * from crm.activities where lead_id = $1 order by created_at desc limit 200", [id]),
    q<Email>("select * from crm.emails where lead_id = $1 order by created_at desc limit 100", [id]),
    q<{ id: number; topic: string; meeting_type: string; starts_at: string; status: string }>(
      "select id, topic, meeting_type, starts_at, status from crm.meetings where lead_id = $1 order by starts_at desc", [id]),
    q<{ id: number; reason: string; priority: string; status: string; created_at: string }>(
      "select id, reason, priority, status, created_at from crm.handoffs where lead_id = $1 order by created_at desc", [id]),
    q<User>("select id, name, role, email from crm.users where active order by name"),
  ]);
  const lastIn = emails.find((e) => e.direction === "in");

  const facts: [string, React.ReactNode][] = [
    ["Email", lead.email], ["Phone / WhatsApp", lead.phone], ["Company", lead.company], ["Role", lead.role],
    ["City / country", lead.city_country], ["Source", lead.source], ["Enquiry", lead.enquiry_type],
    ["Interest", lead.service_interest], ["Budget", lead.budget], ["Timeline", lead.timeline], ["Language", lead.language],
    ["Decision-maker", lead.decision_maker == null ? null : lead.decision_maker ? "Yes" : "No"],
    ["Asked price / call", lead.asked_price_or_call ? "Yes" : "No"],
    ["Regulated sector", lead.regulated_sector == null ? null : lead.regulated_sector ? "Yes" : "No"],
    ...Object.entries(lead.extra || {}).map(([k, v]) => [k.replaceAll("_", " "), v] as [string, React.ReactNode]),
    ["Owner", lead.owner_name], ["Created", fmtDate(lead.created_at)],
  ];

  const tabs = [["timeline", `Timeline (${activities.length})`], ["emails", `Emails (${emails.length})`], ["meetings", `Meetings (${meetings.length})`], ["handoffs", `Handoffs (${handoffs.length})`]];

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <div className="space-y-4">
        <section className="card p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold">{leadName(lead)}</h1>
              <p className="text-sm text-slate-500">{lead.company || lead.service_interest || ""}</p>
            </div>
            <ScoreBadge score={lead.score} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs capitalize text-slate-500">{lead.pipeline ?? "unsorted"}</span>
            <StageBadge stage={lead.stage} /><TempBadge t={lead.temperature} />
            {lead.ai_paused && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">AI paused</span>}
          </div>
          {lead.requirement_summary && <p className="mt-3 rounded-lg bg-teal-50 p-3 text-sm">{lead.requirement_summary}</p>}
          <dl className="mt-4 space-y-1.5 text-sm">
            {facts.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><dt className="capitalize text-slate-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
          </dl>
        </section>
        <section className="card p-5"><LeadControls lead={lead} users={users} /></section>
        {lead.ai_notes && (
          <section className="card p-5">
            <h2 className="mb-2 text-sm font-semibold">AI notes</h2>
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600">{lead.ai_notes}</pre>
          </section>
        )}
      </div>

      <div className="space-y-4">
        <nav className="flex gap-1 border-b border-slate-200">
          {tabs.map(([k, t]) => (
            <a key={k} href={`?tab=${k}`} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === k ? "border-brand font-semibold text-brand" : "border-transparent text-slate-500"}`}>{t}</a>
          ))}
        </nav>

        {tab === "timeline" && (
          <ol className="space-y-3">
            {activities.map((a) => <TimelineItem key={a.id} a={a} />)}
            {activities.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
          </ol>
        )}

        {tab === "emails" && (
          <div className="space-y-4">
            {lead.email && (
              <section className="card p-4">
                <h2 className="mb-2 text-sm font-semibold">{lastIn ? `Reply to "${lastIn.subject}"` : "New email"}</h2>
                <EmailComposer leadId={lead.id} to={lead.email} subject={lastIn ? undefined : "Dream Cyber Security"}
                  replyToMessageId={lastIn?.gmail_message_id} initialBody={lastIn?.status === "needs_human" ? lastIn.ai_suggested_reply : ""} />
              </section>
            )}
            {emails.map((e) => (
              <article key={e.id} className={`card p-4 ${e.direction === "out" ? "ml-10 bg-teal-50/40" : "mr-10"}`}>
                <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                  <span>{e.direction === "in" ? `From ${e.from_addr}` : `To ${e.to_addr} · ${e.sent_by ?? ""}`}</span>
                  <span>{fmtDate(e.created_at)} · {e.status}</span>
                </div>
                <p className="mt-1 font-medium">{e.subject}</p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-slate-700">{e.body_text}</pre>
              </article>
            ))}
          </div>
        )}

        {tab === "meetings" && (
          <div className="card divide-y divide-slate-100">
            {meetings.map((m) => (
              <div key={m.id} className="flex justify-between p-3 text-sm">
                <div><p className="font-medium">{m.topic}</p><p className="text-xs text-slate-500">{m.meeting_type}</p></div>
                <div className="text-right"><p>{fmtDate(m.starts_at)}</p><p className="text-xs text-slate-500">{m.status}</p></div>
              </div>
            ))}
            {meetings.length === 0 && <p className="p-3 text-sm text-slate-400">No meetings booked.</p>}
          </div>
        )}

        {tab === "handoffs" && (
          <div className="card divide-y divide-slate-100">
            {handoffs.map((h) => (
              <div key={h.id} className="flex justify-between p-3 text-sm">
                <p><span className={h.priority === "Urgent" ? "font-semibold text-red-600" : "text-slate-500"}>[{h.priority}]</span> {h.reason}</p>
                <p className="whitespace-nowrap text-xs text-slate-500">{h.status} · {fmtDate(h.created_at)}</p>
              </div>
            ))}
            {handoffs.length === 0 && <p className="p-3 text-sm text-slate-400">No handoffs.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ a }: { a: Activity }) {
  const isIn = a.direction === "in";
  const isMsg = a.type === "message";
  const tone = !isMsg ? "bg-slate-100 text-slate-600"
    : isIn ? "bg-white border border-slate-200" : a.actor?.startsWith("ai") ? "bg-teal-50 border border-teal-100" : "bg-sky-50 border border-sky-100";
  return (
    <li className={`flex ${isMsg && !isIn ? "justify-end" : ""}`}>
      <div className={`max-w-[85%] rounded-xl px-4 py-2.5 ${tone}`}>
        <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">
          {a.type.replace("_", " ")} · {a.channel} · {a.actor} · {fmtDate(a.created_at)}
        </p>
        <p className="whitespace-pre-wrap text-sm">{a.content}</p>
      </div>
    </li>
  );
}
