import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import { PageTitle } from "@/components/Badges";
import EmailComposer from "@/components/EmailComposer";
import { archiveEmail } from "@/lib/actions";
import { ago } from "@/lib/format";
import type { Email } from "@/lib/types";

const FILTERS: Record<string, { label: string; sql: string }> = {
  waiting: { label: "Needs a human", sql: "e.status in ('new','needs_human')" },
  auto: { label: "AI replied", sql: "e.status = 'auto_replied'" },
  all: { label: "All", sql: "true" },
  archived: { label: "Archived", sql: "e.status = 'archived'" },
};

function formatAgent(sentBy?: string | null) {
  if (!sentBy) return "";
  const clean = sentBy.replace(/^ai:/, "").replace(/_/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ f?: string; open?: string }> }) {
  await requireSession();
  const { f = "waiting", open } = await searchParams;
  const filter = FILTERS[f] ?? FILTERS.waiting;

  const [counts, emails] = await Promise.all([
    q1<{ waiting: number; auto: number; all: number; archived: number }>(`
      select
        count(*) filter (where status in ('new','needs_human'))::int as waiting,
        count(*) filter (where status = 'auto_replied')::int as auto,
        count(*)::int as all,
        count(*) filter (where status = 'archived')::int as archived
      from crm.emails where direction = 'in'
    `),
    q<Email>(
      `select e.*, l.name as lead_name from crm.emails e left join crm.leads l on l.id = e.lead_id
        where e.direction = 'in' and ${filter.sql} order by e.created_at desc limit 100`
    ),
  ]);

  const selected = emails.find((e) => String(e.id) === open) ?? emails[0];

  return (
    <>
      <PageTitle
        title="Inbox"
        sub="Gmail inquiries processed by multi-agent AI. Monitor auto-replies, review drafts, and follow up directly."
      />

      {/* Filter Tabs with Live Badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(FILTERS).map(([k, v]) => {
          const count = counts ? counts[k as keyof typeof counts] ?? 0 : 0;
          const isActive = k === f;
          return (
            <Link
              key={k}
              href={`?f=${k}`}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-navy text-white shadow-sm ring-1 ring-navy-800"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-xs"
              }`}
            >
              <span>{v.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold transition ${
                  isActive
                    ? "bg-white/20 text-white"
                    : k === "waiting" && count > 0
                    ? "bg-amber-100 text-amber-800"
                    : k === "auto" && count > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* Email List Column */}
        <ul className="card max-h-[75vh] divide-y divide-slate-100 overflow-y-auto">
          {emails.map((e) => (
            <li key={e.id}>
              <Link
                href={`?f=${f}&open=${e.id}`}
                className={`block p-3.5 transition hover:bg-slate-50 ${
                  selected?.id === e.id ? "bg-navy-50/70 border-l-4 border-gold shadow-xs" : ""
                }`}
              >
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate font-semibold text-navy-950">{e.lead_name || e.from_addr}</span>
                  <span className="shrink-0 text-xs text-slate-400">{ago(e.created_at)}</span>
                </div>
                <p className="truncate text-sm font-medium text-slate-700">{e.subject}</p>
                <p className="truncate text-xs text-slate-400 mt-0.5">{e.body_text?.slice(0, 120)}</p>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {e.status === "auto_replied" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      AI Replied{e.sent_by ? ` · ${formatAgent(e.sent_by)}` : ""}
                    </span>
                  )}
                  {e.status === "needs_human" && e.ai_suggested_reply && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-gold/40 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                      AI draft ready
                    </span>
                  )}
                  {e.status === "needs_human" && !e.ai_suggested_reply && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                      Needs human
                    </span>
                  )}
                  {e.status === "new" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      New
                    </span>
                  )}
                  {e.status === "replied" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                      Replied
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}

          {emails.length === 0 && (
            <li className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-bold text-navy-950">
                {f === "waiting" ? "All caught up!" : "No emails found"}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {f === "waiting"
                  ? "No incoming emails currently need human attention. AI auto-reply is actively handling leads."
                  : `No emails match the "${filter.label}" filter.`}
              </p>
              {f === "waiting" && (counts?.auto ?? 0) > 0 && (
                <Link
                  href="?f=auto"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-900 transition"
                >
                  <span>View {counts?.auto} AI Replied</span>
                  <span>&rarr;</span>
                </Link>
              )}
            </li>
          )}
        </ul>

        {/* Selected Email Detail Column */}
        {selected ? (
          <section className="card space-y-5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-navy-950">{selected.subject}</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  <span className="font-medium text-slate-700">{selected.from_addr}</span> · {ago(selected.created_at)}
                  {selected.lead_id && (
                    <>
                      {" "}·{" "}
                      <Link className="font-semibold text-navy hover:text-gold-dark hover:underline" href={`/leads/${selected.lead_id}`}>
                        Open lead profile &rarr;
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <form action={archiveEmail}>
                  <input type="hidden" name="id" value={selected.id} />
                  <button className="btn-ghost text-xs">Archive</button>
                </form>
              </div>
            </div>

            {/* Inbound Email Body */}
            <div>
              <p className="label">Customer message</p>
              <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-sans text-sm text-slate-800 border border-slate-200/70 shadow-2xs">
                {selected.body_text}
              </pre>
            </div>

            {/* AI Auto-Replied Mode */}
            {selected.status === "auto_replied" ? (
              <div className="space-y-4 pt-2">
                <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-emerald-50/30 p-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                        AI Auto-Replied ({formatAgent(selected.sent_by) || "Agent"})
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-700">Delivered via Gmail</span>
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">
                    {selected.ai_suggested_reply}
                  </pre>
                </div>

                {/* Follow-up composer for human intervention if needed */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-navy-950">Send Human Follow-Up</p>
                      <p className="text-xs text-slate-500">
                        Need to step in, send a proposal link, or clarify details? Send a follow-up directly into this email thread.
                      </p>
                    </div>
                  </div>
                  <EmailComposer
                    key={selected.id}
                    leadId={selected.lead_id}
                    to={selected.from_addr}
                    replyToMessageId={selected.gmail_message_id}
                    compact
                  />
                </div>
              </div>
            ) : (
              /* Needs Human or Draft Mode */
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <p className="label">
                    {selected.ai_suggested_reply
                      ? `AI Suggested Draft (${formatAgent(selected.sent_by) || "Agent"}) — edit or approve`
                      : "Send Reply"}
                  </p>
                  {selected.ai_suggested_reply && (
                    <span className="text-xs font-medium text-amber-700">Review & Send</span>
                  )}
                </div>
                <EmailComposer
                  key={selected.id}
                  leadId={selected.lead_id}
                  to={selected.from_addr}
                  replyToMessageId={selected.gmail_message_id}
                  initialBody={selected.ai_suggested_reply}
                  compact
                />
              </div>
            )}
          </section>
        ) : (
          <div className="card flex items-center justify-center p-12 text-center text-sm text-slate-400">
            Select an email on the left to view details.
          </div>
        )}
      </div>
    </>
  );
}
