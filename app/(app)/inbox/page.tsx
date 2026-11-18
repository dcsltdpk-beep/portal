import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { q } from "@/lib/db";
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

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ f?: string; open?: string }> }) {
  await requireSession();
  const { f = "waiting", open } = await searchParams;
  const filter = FILTERS[f] ?? FILTERS.waiting;
  const emails = await q<Email>(
    `select e.*, l.name as lead_name from crm.emails e left join crm.leads l on l.id = e.lead_id
      where e.direction = 'in' and ${filter.sql} order by e.created_at desc limit 100`);
  const selected = emails.find((e) => String(e.id) === open) ?? emails[0];

  return (
    <>
      <PageTitle title="Inbox" sub="Gmail, read by the AI agents. Check the AI drafts and send them." />
      <div className="mb-3 flex gap-2">
        {Object.entries(FILTERS).map(([k, v]) => (
          <Link key={k} href={`?f=${k}`} className={k === f ? "btn-primary" : "btn-ghost"}>{v.label}</Link>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <ul className="card max-h-[75vh] divide-y divide-slate-100 overflow-y-auto">
          {emails.map((e) => (
            <li key={e.id}>
              <Link href={`?f=${f}&open=${e.id}`} className={`block p-3 hover:bg-slate-50 ${selected?.id === e.id ? "bg-teal-50" : ""}`}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{e.lead_name || e.from_addr}</span>
                  <span className="shrink-0 text-xs text-slate-400">{ago(e.created_at)}</span>
                </div>
                <p className="truncate text-sm">{e.subject}</p>
                <p className="truncate text-xs text-slate-400">{e.body_text?.slice(0, 120)}</p>
                {e.ai_suggested_reply && e.status === "needs_human" && <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 text-[11px] text-amber-700">AI draft ready</span>}
              </Link>
            </li>
          ))}
          {emails.length === 0 && <li className="p-4 text-sm text-slate-400">Inbox zero.</li>}
        </ul>

        {selected && (
          <section className="card space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{selected.subject}</h2>
                <p className="text-sm text-slate-500">
                  {selected.from_addr} · {ago(selected.created_at)}
                  {selected.lead_id && <> · <Link className="text-brand hover:underline" href={`/leads/${selected.lead_id}`}>Open lead</Link></>}
                </p>
              </div>
              <form action={archiveEmail}><input type="hidden" name="id" value={selected.id} /><button className="btn-ghost">Archive</button></form>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-sans text-sm">{selected.body_text}</pre>
            {selected.status === "auto_replied" ? (
              <div>
                <p className="label">AI replied ({selected.sent_by})</p>
                <pre className="whitespace-pre-wrap rounded-lg bg-teal-50 p-4 font-sans text-sm">{selected.ai_suggested_reply}</pre>
              </div>
            ) : (
              <div>
                <p className="label">{selected.ai_suggested_reply ? `AI draft (${selected.sent_by}) - edit, then send` : "Reply"}</p>
                <EmailComposer key={selected.id} leadId={selected.lead_id} replyToMessageId={selected.gmail_message_id}
                  initialBody={selected.ai_suggested_reply} compact />
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
