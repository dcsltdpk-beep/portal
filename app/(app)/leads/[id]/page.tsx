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

  const tabs = [
    ["timeline", `Timeline (${activities.length})`],
    ["emails", `Emails (${emails.length})`],
    ["meetings", `Meetings (${meetings.length})`],
    ["handoffs", `Handoffs (${handoffs.length})`],
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <div className="space-y-4">
        <section className="card p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-navy-950">{leadName(lead)}</h1>
              <p className="text-sm text-slate-500">{lead.company || lead.service_interest || ""}</p>
            </div>
            <ScoreBadge score={lead.score} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs capitalize text-slate-500">{lead.pipeline ?? "unsorted"}</span>
            <StageBadge stage={lead.stage} /><TempBadge t={lead.temperature} />
            {lead.ai_paused && (
              <span className="rounded-full bg-amber-50 border border-gold/30 px-2 py-0.5 text-xs font-semibold text-amber-800">
                AI paused
              </span>
            )}
          </div>
          {lead.requirement_summary && (
            <p className="mt-3 rounded-lg bg-navy-50/60 border border-navy-border/20 p-3 text-sm text-navy-950">
              {lead.requirement_summary}
            </p>
          )}
          <dl className="mt-4 space-y-1.5 text-sm">
            {facts.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="capitalize text-slate-500">{k}</dt>
                <dd className="text-right font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="card p-5"><LeadControls lead={lead} users={users} /></section>
        {lead.ai_notes && (
          <section className="card p-5">
            <h2 className="mb-2 text-sm font-bold text-navy-950">AI notes</h2>
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
              {lead.ai_notes}
            </pre>
          </section>
        )}
      </div>

      <div className="space-y-4">
        <nav className="flex gap-2 border-b border-slate-200">
          {tabs.map(([k, t]) => (
            <a
              key={k}
              href={`?tab=${k}`}
              className={`-mb-px border-b-2 px-3 py-2 text-sm transition ${
                tab === k
                  ? "border-navy font-bold text-navy"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t}
            </a>
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
                <h2 className="mb-2 text-sm font-bold text-navy-950">{lastIn ? `Reply to "${lastIn.subject}"` : "New email"}</h2>
                <EmailComposer leadId={lead.id} to={lead.email} subject={lastIn ? undefined : "Dream Cyber Security"}
                  replyToMessageId={lastIn?.gmail_message_id} initialBody={lastIn?.status === "needs_human" ? lastIn.ai_suggested_reply : ""} />
              </section>
            )}
            {emails.map((e) => (
              <article
                key={e.id}
                className={`card p-4 transition ${
                  e.direction === "out" ? "ml-10 bg-navy-50/40 border-navy-border/20" : "mr-10"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-medium">{e.direction === "in" ? `From ${e.from_addr}` : `To ${e.to_addr}${e.sent_by ? ` · ${e.sent_by}` : ""}`}</span>
                  <div className="flex items-center gap-2">
                    <span>{fmtDate(e.created_at)}</span>
                    {e.status === "auto_replied" ? (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 font-bold text-emerald-700 text-[10px]">
                        ✓ AI Auto-Replied
                      </span>
                    ) : e.status === "needs_human" ? (
                      <span className="rounded-full bg-amber-50 border border-gold/40 px-2 py-0.5 font-semibold text-amber-800 text-[10px]">
                        Needs Human
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 text-[10px]">
                        {e.status}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-1 font-semibold text-navy-950">{e.subject}</p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-slate-700">{e.body_text}</pre>
              </article>
            ))}
          </div>
        )}

        {tab === "meetings" && (
          <div className="card divide-y divide-slate-100">
            {meetings.map((m) => (
              <div key={m.id} className="flex justify-between p-3.5 text-sm hover:bg-slate-50/60 transition">
                <div><p className="font-semibold text-navy-950">{m.topic}</p><p className="text-xs text-slate-500">{m.meeting_type}</p></div>
                <div className="text-right"><p className="font-medium">{fmtDate(m.starts_at)}</p><p className="text-xs text-slate-500">{m.status}</p></div>
              </div>
            ))}
            {meetings.length === 0 && <p className="p-3 text-sm text-slate-400">No meetings booked.</p>}
          </div>
        )}

        {tab === "handoffs" && (
          <div className="card divide-y divide-slate-100">
            {handoffs.map((h) => (
              <div key={h.id} className="flex justify-between p-3.5 text-sm hover:bg-slate-50/60 transition">
                <p>
                  <span className={h.priority === "Urgent" ? "font-bold text-red-600" : "text-slate-500"}>
                    [{h.priority}]
                  </span>{" "}
                  <span className="font-medium text-navy-950">{h.reason}</span>
                </p>
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
  const tone = !isMsg
    ? "bg-slate-100 text-slate-600"
    : isIn
    ? "bg-white border border-slate-200"
    : a.actor?.startsWith("ai")
    ? "bg-navy-50/70 border border-navy-border/25 text-navy-950"
    : "bg-amber-50/60 border border-gold/30 text-amber-950";
  return (
    <li className={`flex ${isMsg && !isIn ? "justify-end" : ""}`}>
      <div className={`max-w-[85%] rounded-xl px-4 py-2.5 shadow-2xs ${tone}`}>
        <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400 font-medium">
          {a.type.replace("_", " ")} · {a.channel} · {a.actor} · {fmtDate(a.created_at)}
        </p>
        <p className="whitespace-pre-wrap font-sans text-sm">{a.content}</p>
      </div>
    </li>
  );
}
