import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
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
  waiting: { label: "Needs human", sql: "e.status in ('new','needs_human')" },
  auto: { label: "AI replied", sql: "e.status = 'auto_replied'" },
  all: { label: "All conversations", sql: "true" },
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
    <div className="flex flex-col h-[calc(100vh-84px)] max-h-[calc(100vh-84px)] overflow-hidden">
      {/* Compact Unified Header Bar */}
      <div className="mb-2.5 shrink-0 flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-navy-950 tracking-tight">Omnichannel Inbox</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Multi-Agent Live
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Real-time unified conversations across Gmail, WhatsApp & social channels.
          </p>
        </div>

        {/* Channel Switcher Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
          {CHANNELS.map((c) => {
            const isActive = channel === c.id;
            return (
              <Link
                key={c.id}
                href={`?channel=${c.id}&f=${f}`}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  isActive
                    ? "bg-navy-950 text-gold shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-navy-950"
                }`}
              >
                {c.id === "all" && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                )}
                {c.id === "gmail" && (
                  <svg className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {c.id === "whatsapp" && (
                  <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.961.933 3.018.933h.005c3.18 0 5.767-2.587 5.768-5.766.001-3.181-2.585-5.767-5.768-5.767zm0 10.375c-.947 0-1.874-.255-2.684-.736l-.192-.114-1.992.523.532-1.942-.125-.199c-.529-.841-.807-1.815-.807-2.82 0-2.898 2.358-5.257 5.259-5.257 2.898 0 5.257 2.359 5.257 5.258 0 2.899-2.359 5.258-5.258 5.258z" />
                  </svg>
                )}
                {c.id === "facebook" && (
                  <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                )}
                {c.id === "instagram" && (
                  <svg className="h-3 w-3 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                  </svg>
                )}
                <span>{c.label}</span>
                {c.badge && (
                  <span
                    className={`rounded px-1 text-[9px] font-bold ${
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
      </div>

      {isEmailChannel ? (
        <>
          {/* Status Filters Bar */}
          <div className="mb-2.5 shrink-0 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              {Object.entries(FILTERS).map(([k, v]) => {
                const count = counts ? counts[k as keyof typeof counts] ?? 0 : 0;
                const isActive = k === f;
                return (
                  <Link
                    key={k}
                    href={`?channel=${channel}&f=${k}`}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      isActive
                        ? "bg-navy-950 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80 shadow-2xs"
                    }`}
                  >
                    <span>{v.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.1 text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : k === "waiting" && count > 0
                          ? "bg-amber-100 text-amber-800"
                          : k === "auto" && count > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </Link>
                );
              })}
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Showing {emails.length} inquiries
            </span>
          </div>

          {/* Main 2-Pane Zero-Scroll Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-3 flex-1 min-h-0 overflow-hidden">
            {/* Left Pane: Email List */}
            <div className="card p-0 flex flex-col h-full min-h-0 overflow-hidden bg-white shadow-xs border border-slate-200/80">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0 text-xs text-slate-500 font-semibold">
                <span>Thread Queue</span>
                <span className="text-[10px] text-slate-400">Auto-synced with Gmail</span>
              </div>

              <ul className="flex-1 min-h-0 divide-y divide-slate-100 overflow-y-auto">
                {emails.map((e) => {
                  const isSelected = selected?.id === e.id;
                  return (
                    <li key={e.id}>
                      <Link
                        href={`?channel=${channel}&f=${f}&open=${e.id}`}
                        className={`block p-3 transition hover:bg-slate-50/80 ${
                          isSelected
                            ? "bg-navy-50/80 border-l-4 border-navy-950 shadow-2xs"
                            : "border-l-4 border-transparent"
                        }`}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className={`text-xs truncate font-bold ${isSelected ? "text-navy-950" : "text-slate-800"}`}>
                            {e.lead_name || e.from_addr}
                          </span>
                          <span className="shrink-0 text-[10px] text-slate-400">{ago(e.created_at)}</span>
                        </div>

                        <p className="truncate text-xs font-medium text-slate-700 mt-0.5">{e.subject}</p>
                        <p className="truncate text-[11px] text-slate-400 mt-0.5">{e.body_text?.slice(0, 100)}</p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-0.5 rounded bg-red-50 border border-red-200/60 px-1 py-0.2 text-[9px] font-bold text-red-700">
                            Gmail
                          </span>

                          {e.status === "auto_replied" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700">
                              <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              AI Replied{e.sent_by ? ` · ${formatAgent(e.sent_by)}` : ""}
                            </span>
                          )}
                          {e.status === "needs_human" && e.ai_suggested_reply && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                              AI draft ready
                            </span>
                          )}
                          {e.status === "needs_human" && !e.ai_suggested_reply && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                              Needs human
                            </span>
                          )}
                          {e.status === "new" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700">
                              New
                            </span>
                          )}
                          {e.status === "replied" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-1.5 py-0.2 text-[10px] font-semibold text-purple-700">
                              Replied
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}

                {emails.length === 0 && (
                  <li className="p-8 text-center">
                    <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-navy-950">
                      {f === "waiting" ? "All caught up!" : "No emails found"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                      {f === "waiting"
                        ? "No incoming emails currently need human attention. AI auto-reply is actively handling leads."
                        : `No emails match the "${filter.label}" filter.`}
                    </p>
                    {f === "waiting" && (counts?.auto ?? 0) > 0 && (
                      <Link
                        href={`?channel=${channel}&f=auto`}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-navy-950 px-3 py-1 text-xs font-semibold text-gold hover:bg-navy-900 transition"
                      >
                        <span>View {counts?.auto} AI Replied</span>
                        <span>&rarr;</span>
                      </Link>
                    )}
                  </li>
                )}
              </ul>
            </div>

            {/* Right Pane: Selected Email Details & Pinned Reply Box */}
            {selected ? (
              <div className="card p-0 flex flex-col h-full min-h-0 overflow-hidden bg-white shadow-xs border border-slate-200/80">
                {/* Fixed Top Detail Header */}
                <div className="p-3.5 border-b border-slate-100 bg-white shrink-0 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded bg-red-50 border border-red-200/60 px-1.5 py-0.2 text-[10px] font-bold text-red-700 shrink-0">
                        Gmail
                      </span>
                      <h2 className="text-sm sm:text-base font-bold text-navy-950 truncate">
                        {selected.subject || "(No subject)"}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-slate-700">{selected.from_addr}</span>
                      <span>·</span>
                      <span>{ago(selected.created_at)}</span>
                      {selected.lead_id && (
                        <>
                          <span>·</span>
                          <Link
                            className="font-bold text-navy hover:text-gold-dark transition hover:underline"
                            href={`/leads/${selected.lead_id}`}
                          >
                            Open lead profile &rarr;
                          </Link>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <form action={archiveEmail}>
                      <input type="hidden" name="id" value={selected.id} />
                      <button className="btn-ghost py-1 px-2.5 text-xs text-slate-600 hover:text-navy-950">
                        Archive
                      </button>
                    </form>
                  </div>
                </div>

                {/* Scrollable Conversation Thread Body */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3 bg-slate-50/50">
                  {/* Customer Message Card */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        Customer Message
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{selected.from_addr}</span>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {selected.body_text}
                    </pre>
                  </div>

                  {/* AI Auto-Replied Message Card */}
                  {selected.status === "auto_replied" && (
                    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-emerald-50/40 to-white p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                            AI Auto-Replied ({formatAgent(selected.sent_by) || "Agent"})
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                          Delivered via Gmail
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-800 leading-relaxed">
                        {selected.ai_suggested_reply}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Anchored Bottom Reply Composer */}
                <div className="p-3 border-t border-slate-200/80 bg-white shrink-0 shadow-2xs">
                  {selected.status === "auto_replied" ? (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          <span className="text-xs font-bold text-navy-950">Send Human Follow-Up</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Step in, send proposal link, or clarify details</span>
                      </div>
                      <EmailComposer
                        key={selected.id}
                        leadId={selected.lead_id}
                        to={selected.from_addr}
                        replyToMessageId={selected.gmail_message_id}
                        compact
                        rows={2}
                        placeholder="Type a follow-up to continue this thread with the customer..."
                        buttonLabel="Send follow-up"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-navy-950">
                          {selected.ai_suggested_reply
                            ? `AI Suggested Draft (${formatAgent(selected.sent_by) || "Agent"}) — Review & Send`
                            : "Send Reply to Customer"}
                        </span>
                        {selected.ai_suggested_reply && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                            AI drafted
                          </span>
                        )}
                      </div>
                      <EmailComposer
                        key={selected.id}
                        leadId={selected.lead_id}
                        to={selected.from_addr}
                        replyToMessageId={selected.gmail_message_id}
                        initialBody={selected.ai_suggested_reply}
                        compact
                        rows={3}
                        placeholder="Write your reply..."
                        buttonLabel={selected.ai_suggested_reply ? "Approve & Send" : "Send reply"}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card flex items-center justify-center p-8 text-center text-xs text-slate-400 bg-white border border-slate-200/80">
                Select a conversation on the left to view messages.
              </div>
            )}
          </div>
        </>
      ) : (
        /* Channel Onboarding & Architecture Card for WhatsApp, FB & IG */
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="card p-6 text-center max-w-lg w-full space-y-3 bg-white border border-slate-200/80 shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 border border-navy-border/30 text-navy">
              {channel === "whatsapp" && (
                <svg className="h-6 w-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.961.933 3.018.933h.005c3.18 0 5.767-2.587 5.768-5.766.001-3.181-2.585-5.767-5.768-5.767zm0 10.375c-.947 0-1.874-.255-2.684-.736l-.192-.114-1.992.523.532-1.942-.125-.199c-.529-.841-.807-1.815-.807-2.82 0-2.898 2.358-5.257 5.259-5.257 2.898 0 5.257 2.359 5.257 5.258 0 2.899-2.359 5.258-5.258 5.258z" />
                </svg>
              )}
              {channel === "facebook" && (
                <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              )}
              {channel === "instagram" && (
                <svg className="h-6 w-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                </svg>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-navy-950 capitalize">
                {channel === "whatsapp" && "WhatsApp Business Cloud API"}
                {channel === "facebook" && "Facebook Comments & Messenger"}
                {channel === "instagram" && "Instagram Comments & DMs"}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                {channel === "whatsapp" &&
                  "Multi-agent architecture is ready. Once connected via n8n webhook, inbound WhatsApp chats will route directly to Services, Academy & Client Care AI agents here."}
                {channel === "facebook" &&
                  "Meta Graph API integration planned. AI agents will monitor public ad comments, reply with relevant answers, and convert commenters into CRM leads."}
                {channel === "instagram" &&
                  "Instagram Graph API integration planned. Automatically reply to Reel comments, story mentions, and DM inquiries with multi-agent intelligence."}
              </p>
            </div>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-950 px-3 py-1 text-[11px] font-semibold text-gold">
                <span>● Schema & Database Ready</span>
              </span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <Link href="?channel=all" className="text-xs font-bold text-navy hover:text-gold-dark transition">
                &larr; Back to All Channels (Gmail Live)
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
