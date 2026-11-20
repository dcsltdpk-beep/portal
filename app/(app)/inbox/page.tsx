import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import { PageTitle } from "@/components/Badges";
import EmailComposer from "@/components/EmailComposer";
import { archiveEmail } from "@/lib/actions";
import { ago } from "@/lib/format";
import type { Email } from "@/lib/types";

type ChannelTab = {
  id: string;
  label: string;
  status: "active" | "ready" | "planned";
  badge?: string;
};

const CHANNELS: ChannelTab[] = [
  { id: "all", label: "All Channels", status: "active" },
  { id: "gmail", label: "Gmail", status: "active", badge: "Live" },
  { id: "whatsapp", label: "WhatsApp", status: "ready", badge: "Ready" },
  { id: "facebook", label: "Facebook", status: "planned", badge: "Next" },
  { id: "instagram", label: "Instagram", status: "planned", badge: "Next" },
];

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

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; channel?: string; open?: string }>;
}) {
  await requireSession();
  const { f = "waiting", channel = "all", open } = await searchParams;
  const filter = FILTERS[f] ?? FILTERS.waiting;

  const isEmailChannel = channel === "all" || channel === "gmail";

  const [counts, emails] = await Promise.all([
    q1<{ waiting: number; auto: number; all: number; archived: number }>(`
      select
        count(*) filter (where status in ('new','needs_human'))::int as waiting,
        count(*) filter (where status = 'auto_replied')::int as auto,
        count(*)::int as all,
        count(*) filter (where status = 'archived')::int as archived
      from crm.emails where direction = 'in'
    `),
    isEmailChannel
      ? q<Email>(
          `select e.*, l.name as lead_name from crm.emails e left join crm.leads l on l.id = e.lead_id
            where e.direction = 'in' and ${filter.sql} order by e.created_at desc limit 100`
        )
      : Promise.resolve([]),
  ]);

  const selected = emails.find((e) => String(e.id) === open) ?? emails[0];

  return (
    <>
      <PageTitle
        title="Omnichannel Inbox"
        sub="Unified multi-agent communications hub. Scalable architecture ready for Gmail, WhatsApp, Facebook and Instagram."
      />

      {/* Channel Switcher Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {CHANNELS.map((c) => {
          const isActive = channel === c.id;
          return (
            <Link
              key={c.id}
              href={`?channel=${c.id}&f=${f}`}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                isActive
                  ? "bg-navy-950 text-gold shadow-xs ring-1 ring-navy-800"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-navy-950 border border-slate-200/80"
              }`}
            >
              {/* Channel Icons */}
              {c.id === "all" && (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
              {c.id === "gmail" && (
                <svg className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
              {c.id === "whatsapp" && (
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.961.933 3.018.933h.005c3.18 0 5.767-2.587 5.768-5.766.001-3.181-2.585-5.767-5.768-5.767zm0 10.375c-.947 0-1.874-.255-2.684-.736l-.192-.114-1.992.523.532-1.942-.125-.199c-.529-.841-.807-1.815-.807-2.82 0-2.898 2.358-5.257 5.259-5.257 2.898 0 5.257 2.359 5.257 5.258 0 2.899-2.359 5.258-5.258 5.258z" />
                </svg>
              )}
              {c.id === "facebook" && (
                <svg className="h-3.5 w-3.5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              )}
              {c.id === "instagram" && (
                <svg className="h-3.5 w-3.5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              )}

              <span>{c.label}</span>

              {c.badge && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                    c.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : c.status === "ready"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {c.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* If Gmail or All is active, show the live filter tabs */}
      {isEmailChannel ? (
        <>
          {/* Status Filter Tabs with Live Badges */}
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(FILTERS).map(([k, v]) => {
              const count = counts ? counts[k as keyof typeof counts] ?? 0 : 0;
              const isActive = k === f;
              return (
                <Link
                  key={k}
                  href={`?channel=${channel}&f=${k}`}
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
                    href={`?channel=${channel}&f=${f}&open=${e.id}`}
                    className={`block p-3.5 transition hover:bg-slate-50 ${
                      selected?.id === e.id ? "bg-navy-50/70 border-l-4 border-gold shadow-xs" : ""
                    }`}
                  >
                    <div className="flex justify-between gap-2 text-sm">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate font-semibold text-navy-950">{e.lead_name || e.from_addr}</span>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{ago(e.created_at)}</span>
                    </div>

                    <p className="truncate text-sm font-medium text-slate-700 mt-0.5">{e.subject}</p>
                    <p className="truncate text-xs text-slate-400 mt-0.5">{e.body_text?.slice(0, 120)}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {/* Channel Badge */}
                      <span className="inline-flex items-center gap-1 rounded bg-red-50 border border-red-200/60 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                        Gmail
                      </span>

                      {/* Status Badges */}
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
                      href={`?channel=${channel}&f=auto`}
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
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded bg-red-50 border border-red-200/60 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                        Gmail
                      </span>
                      <h2 className="text-lg font-bold text-navy-950">{selected.subject}</h2>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
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
                            Need to step in, send a proposal link, or clarify details? Send a follow-up directly into this thread.
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
      ) : (
        /* CHANNEL ONBOARDING & ARCHITECTURE CARD FOR WHATSAPP, FB & IG */
        <div className="card p-8 text-center max-w-2xl mx-auto my-6 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 border border-navy-border/30 text-navy">
            {channel === "whatsapp" && (
              <svg className="h-7 w-7 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.961.933 3.018.933h.005c3.18 0 5.767-2.587 5.768-5.766.001-3.181-2.585-5.767-5.768-5.767zm0 10.375c-.947 0-1.874-.255-2.684-.736l-.192-.114-1.992.523.532-1.942-.125-.199c-.529-.841-.807-1.815-.807-2.82 0-2.898 2.358-5.257 5.259-5.257 2.898 0 5.257 2.359 5.257 5.258 0 2.899-2.359 5.258-5.258 5.258z" />
              </svg>
            )}
            {channel === "facebook" && (
              <svg className="h-7 w-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            )}
            {channel === "instagram" && (
              <svg className="h-7 w-7 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
              </svg>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-navy-950 capitalize">
              {channel === "whatsapp" && "WhatsApp Business Cloud API"}
              {channel === "facebook" && "Facebook Comments & Messenger"}
              {channel === "instagram" && "Instagram Comments & DMs"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {channel === "whatsapp" &&
                "Multi-agent architecture is ready for WhatsApp. Once connected via n8n WhatsApp webhook, chats will route to Services, Academy & Client Care AI agents here."}
              {channel === "facebook" &&
                "Meta Graph API integration planned. AI agents will automatically monitor public ad comments, reply with relevant answers, and convert commenters into CRM leads."}
              {channel === "instagram" &&
                "Instagram Graph API integration planned. Automatically reply to Reel comments, story mentions, and DM inquiries with multi-agent intelligence."}
            </p>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3.5 py-1 text-xs font-semibold text-white">
              <span>● Pipeline Schema Ready</span>
            </span>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <Link href="?channel=all" className="text-xs font-bold text-navy hover:text-gold transition">
              &larr; Back to All Channels (Gmail Live)
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
