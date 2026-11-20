import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import { PageTitle } from "@/components/Badges";
import { closeHandoff, reopenHandoff } from "@/lib/actions";
import { ago } from "@/lib/format";

type HandoffRow = {
  id: number;
  lead_id: string;
  lead_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  channel: string;
  reason: string;
  priority: string;
  last_message: string | null;
  status: string;
  created_at: string;
  closed_at: string | null;
};

type HandoffStats = {
  open_count: number;
  urgent_count: number;
  closed_count: number;
  total_count: number;
};

export default async function HandoffsPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; q?: string }>;
}) {
  await requireSession();
  const { f = "open", q: query } = await searchParams;

  const filterSql =
    f === "urgent"
      ? "h.status <> 'Closed' and h.priority = 'Urgent'"
      : f === "closed"
      ? "h.status = 'Closed'"
      : f === "all"
      ? "true"
      : "h.status <> 'Closed'";

  const [stats, rows] = await Promise.all([
    q1<HandoffStats>(`
      select
        count(*) filter (where status <> 'Closed')::int as open_count,
        count(*) filter (where status <> 'Closed' and priority = 'Urgent')::int as urgent_count,
        count(*) filter (where status = 'Closed')::int as closed_count,
        count(*)::int as total_count
      from crm.handoffs
    `),
    q<HandoffRow>(`
      select h.*, l.name as lead_name, l.company, l.email, l.phone
      from crm.handoffs h
      join crm.leads l on l.id = h.lead_id
      where ${filterSql}
      order by (h.priority = 'Urgent' and h.status <> 'Closed') desc, h.created_at desc
      limit 200
    `),
  ]);

  const openCount = stats?.open_count ?? 0;
  const urgentCount = stats?.urgent_count ?? 0;
  const closedCount = stats?.closed_count ?? 0;
  const totalCount = stats?.total_count ?? 0;

  return (
    <div className="space-y-5">
      <PageTitle
        title="Handoffs Queue"
        sub="Conversations escalated by AI agents for direct human review and immediate intervention."
      />

      {/* Top Operational Metrics */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Open Queue */}
        <div className="card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Needs Action</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                openCount > 0
                  ? "bg-red-50 text-red-700 border border-red-200/80"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
              }`}
            >
              {openCount > 0 ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  Active ({openCount})
                </>
              ) : (
                "All Clear"
              )}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-navy-950">{openCount}</span>
            <span className="text-xs font-medium text-slate-500">Open Escalations</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requiring immediate team intervention</p>
        </div>

        {/* Metric 2: Urgent Priority */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority Level</span>
            <span className="rounded-full bg-amber-50 text-amber-800 border border-gold/40 px-2 py-0.5 text-[10px] font-bold">
              Critical
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-navy-950">{urgentCount}</span>
            <span className="text-xs font-medium text-amber-700">Urgent Priority</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">High conversion or time-sensitive leads</p>
        </div>

        {/* Metric 3: Resolved */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Resolution</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              Resolved
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-navy-950">{closedCount}</span>
            <span className="text-xs font-medium text-slate-500">Closed Handoffs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total escalations addressed by team</p>
        </div>

        {/* Metric 4: AI Agent Efficiency */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Guardrail</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold">
              Autonomous
            </span>
          </div>

          <div className="mt-2">
            <span className="text-3xl font-extrabold tracking-tight text-navy-950">
              {totalCount > 0 ? `${Math.round((closedCount / totalCount) * 100)}%` : "100%"}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">Resolution completion rate</p>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Out of {totalCount} total logged handoffs</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="?f=open"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              f === "open"
                ? "bg-navy-950 text-gold shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <span>Needs Action</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                openCount > 0
                  ? "bg-red-600 text-white"
                  : f === "open"
                  ? "bg-gold/20 text-gold"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {openCount}
            </span>
          </Link>

          <Link
            href="?f=urgent"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              f === "urgent"
                ? "bg-navy-950 text-gold shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <span>Urgent Only</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                urgentCount > 0
                  ? "bg-red-600 text-white"
                  : f === "urgent"
                  ? "bg-gold/20 text-gold"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {urgentCount}
            </span>
          </Link>

          <Link
            href="?f=closed"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              f === "closed"
                ? "bg-navy-950 text-gold shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <span>Resolved</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                f === "closed" ? "bg-gold/20 text-gold" : "bg-slate-100 text-slate-600"
              }`}
            >
              {closedCount}
            </span>
          </Link>

          <Link
            href="?f=all"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              f === "all"
                ? "bg-navy-950 text-gold shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <span>All History</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                f === "all" ? "bg-gold/20 text-gold" : "bg-slate-100 text-slate-600"
              }`}
            >
              {totalCount}
            </span>
          </Link>
        </div>
      </div>

      {/* Handoff Cards List */}
      <div className="space-y-3.5">
        {rows.map((h) => {
          const isUrgent = h.priority === "Urgent";
          const isClosed = h.status === "Closed";
          const cleanPhone = h.phone?.replace(/[^0-9]/g, "");

          return (
            <div
              key={h.id}
              className={`card p-5 transition ${
                isClosed
                  ? "border-l-4 border-l-slate-300 bg-slate-50/50 opacity-85"
                  : isUrgent
                  ? "border-l-4 border-l-red-500 bg-red-50/25 shadow-xs"
                  : "border-l-4 border-l-gold bg-white shadow-2xs hover:shadow-xs"
              }`}
            >
              {/* Card Header Row */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Priority Badge */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                      isUrgent
                        ? "bg-red-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {isUrgent && (
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.316.492-.533 1.035-.688 1.587a15.82 15.82 0 01-.482 1.488c-.147.41-.308.82-.477 1.229a1 1 0 01-.89.605 1 1 0 01-.9-1.042 9.07 9.07 0 01.378-2.072 1 1 0 00-1.78-.9A11.08 11.08 0 004 8c0 4.418 3.582 8 8 8s8-3.582 8-8c0-.776-.11-1.527-.315-2.238a1 1 0 00-1.722-.444 8.97 8.97 0 01-1.568 1.492z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {h.priority}
                  </span>

                  {/* Channel Badge */}
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200/60 uppercase tracking-wider">
                    {h.channel === "email" && (
                      <svg className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {h.channel === "whatsapp" && (
                      <svg className="h-3 w-3 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.961.933 3.018.933h.005c3.18 0 5.767-2.587 5.768-5.766.001-3.181-2.585-5.767-5.768-5.767zm0 10.375c-.947 0-1.874-.255-2.684-.736l-.192-.114-1.992.523.532-1.942-.125-.199c-.529-.841-.807-1.815-.807-2.82 0-2.898 2.358-5.257 5.259-5.257 2.898 0 5.257 2.359 5.257 5.258 0 2.899-2.359 5.258-5.258 5.258z" />
                      </svg>
                    )}
                    <span>{h.channel}</span>
                  </span>

                  {/* Status Indicator */}
                  {isClosed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      ✓ Resolved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-gold/40 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Waiting Human
                    </span>
                  )}
                </div>

                <div className="text-right text-xs text-slate-400">
                  {isClosed && h.closed_at ? (
                    <span>Resolved {ago(h.closed_at)}</span>
                  ) : (
                    <span>Escalated {ago(h.created_at)}</span>
                  )}
                </div>
              </div>

              {/* Card Body: Lead Info & Escalation Reason */}
              <div className="mt-3.5 space-y-3">
                {/* Lead Headline */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-xs font-bold text-gold shadow-2xs">
                      {(h.lead_name || h.email || "L").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <Link
                        href={`/leads/${h.lead_id}`}
                        className="text-base font-bold text-navy-950 hover:text-gold-dark hover:underline"
                      >
                        {h.lead_name || "Unknown Lead"}
                      </Link>
                      {h.company && <span className="text-xs text-slate-400 ml-1.5 font-medium">({h.company})</span>}
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        {h.email && <span>{h.email}</span>}
                        {h.email && h.phone && <span>·</span>}
                        {h.phone && <span>{h.phone}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason Banner */}
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-950">
                    <svg className="h-4 w-4 text-gold-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Escalation Reason:</span>
                  </div>
                  <p className="mt-1 font-semibold text-sm text-navy-950">{h.reason}</p>
                </div>

                {/* Customer Last Message Speech Bubble */}
                {h.last_message && (
                  <div className="rounded-xl border border-slate-200/60 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Customer&apos;s Last Message:
                    </p>
                    <p className="font-sans text-sm text-slate-800 leading-relaxed italic">
                      &ldquo;{h.last_message}&rdquo;
                    </p>
                  </div>
                )}

                {/* Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Open Lead Profile */}
                    <Link
                      href={`/leads/${h.lead_id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-900 transition"
                    >
                      <span>Open Lead Profile</span>
                      <span>&rarr;</span>
                    </Link>

                    {/* Quick WhatsApp Action if phone exists */}
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                      >
                        <svg className="h-3.5 w-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.961.933 3.018.933h.005c3.18 0 5.767-2.587 5.768-5.766.001-3.181-2.585-5.767-5.768-5.767zm0 10.375c-.947 0-1.874-.255-2.684-.736l-.192-.114-1.992.523.532-1.942-.125-.199c-.529-.841-.807-1.815-.807-2.82 0-2.898 2.358-5.257 5.259-5.257 2.898 0 5.257 2.359 5.257 5.258 0 2.899-2.359 5.258-5.258 5.258z" />
                        </svg>
                        <span>Chat WhatsApp</span>
                      </a>
                    )}

                    {/* Direct Inbox Action if email channel */}
                    {h.channel === "email" && (
                      <Link
                        href={`/inbox?open=${h.lead_id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <svg className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>View in Inbox</span>
                      </Link>
                    )}
                  </div>

                  {/* Resolution Toggle Button */}
                  <div>
                    {!isClosed ? (
                      <form action={closeHandoff}>
                        <input type="hidden" name="id" value={h.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-600 hover:text-white transition shadow-2xs"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Mark Resolved</span>
                        </button>
                      </form>
                    ) : (
                      <form action={reopenHandoff}>
                        <input type="hidden" name="id" value={h.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                          <span>Reopen Handoff</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {rows.length === 0 && (
          <div className="card p-12 text-center max-w-lg mx-auto">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-navy-950">
              {f === "open"
                ? "Queue is Clear!"
                : f === "urgent"
                ? "No Urgent Escalations"
                : "No Handoffs Found"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {f === "open"
                ? "All customer conversations escalated by AI agents have been addressed. AI is running autonomously."
                : `No records currently match the "${f}" filter.`}
            </p>
            {f !== "all" && totalCount > 0 && (
              <Link
                href="?f=all"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-gold transition"
              >
                <span>View all {totalCount} past handoffs &rarr;</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
