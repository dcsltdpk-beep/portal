import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
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
  const { f = "open" } = await searchParams;

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
    <div className="space-y-3">
      {/* Compact Header: Title + Live Status + Filter Tabs all in one sleek bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight text-navy-950">Handoffs Queue</h1>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              openCount > 0
                ? "bg-red-50 text-red-700 border border-red-200/80"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
            }`}
          >
            {openCount > 0 ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>{openCount} Needing Action</span>
              </>
            ) : (
              <>
                <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>All Clear</span>
              </>
            )}
          </span>
        </div>

        {/* Filter Pills with Counts */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Link
            href="?f=open"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition ${
              f === "open"
                ? "bg-navy-950 text-gold shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <span>Needs Action</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
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
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition ${
              f === "urgent"
                ? "bg-navy-950 text-gold shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <span>Urgent</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
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
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition ${
              f === "closed"
                ? "bg-navy-950 text-gold shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <span>Resolved</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                f === "closed" ? "bg-gold/20 text-gold" : "bg-slate-100 text-slate-600"
              }`}
            >
              {closedCount}
            </span>
          </Link>

          <Link
            href="?f=all"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition ${
              f === "all"
                ? "bg-navy-950 text-gold shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <span>All</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                f === "all" ? "bg-gold/20 text-gold" : "bg-slate-100 text-slate-600"
              }`}
            >
              {totalCount}
            </span>
          </Link>
        </div>
      </div>

      {/* Handoff Cards List: Compact, Unified & Zero-Scroll Fit */}
      <div className="space-y-2.5 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
        {rows.map((h) => {
          const isUrgent = h.priority === "Urgent";
          const isClosed = h.status === "Closed";
          const cleanPhone = h.phone?.replace(/[^0-9]/g, "");

          return (
            <div
              key={h.id}
              className={`card p-3.5 transition shadow-2xs hover:shadow-xs ${
                isClosed
                  ? "border-l-4 border-l-slate-300 bg-slate-50/60 opacity-85"
                  : isUrgent
                  ? "border-l-4 border-l-red-500 bg-red-50/20"
                  : "border-l-4 border-l-gold bg-white"
              }`}
            >
              {/* Row 1: Lead Info & Instant Action Buttons side-by-side */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Left: Lead Identity, Priority & Channel */}
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy text-[10px] font-bold text-gold shrink-0">
                    {(h.lead_name || h.email || "L").charAt(0).toUpperCase()}
                  </div>

                  <Link
                    href={`/leads/${h.lead_id}`}
                    className="text-sm font-bold text-navy-950 hover:text-gold hover:underline truncate"
                  >
                    {h.lead_name || "Unknown Lead"}
                  </Link>

                  {h.company && (
                    <span className="text-[11px] text-slate-400 font-medium truncate">
                      ({h.company})
                    </span>
                  )}

                  {h.email && (
                    <span className="text-xs text-slate-500 font-medium truncate">
                      · {h.email}
                    </span>
                  )}

                  {/* Priority & Channel Badges */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[9px] font-black uppercase tracking-wider ${
                      isUrgent
                        ? "bg-red-600 text-white"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {h.priority}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.2 text-[9px] font-bold text-slate-600 border border-slate-200/60 uppercase">
                    {h.channel === "email" && (
                      <svg className="h-2.5 w-2.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {h.channel === "whatsapp" && (
                      <svg className="h-2.5 w-2.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.961.933 3.018.933h.005c3.18 0 5.767-2.587 5.768-5.766.001-3.181-2.585-5.767-5.768-5.767zm0 10.375c-.947 0-1.874-.255-2.684-.736l-.192-.114-1.992.523.532-1.942-.125-.199c-.529-.841-.807-1.815-.807-2.82 0-2.898 2.358-5.257 5.259-5.257 2.898 0 5.257 2.359 5.257 5.258 0 2.899-2.359 5.258-5.258 5.258z" />
                      </svg>
                    )}
                    <span>{h.channel}</span>
                  </span>

                  <span className="text-[10px] text-slate-400">
                    · {isClosed && h.closed_at ? `Resolved ${ago(h.closed_at)}` : ago(h.created_at)}
                  </span>
                </div>

                {/* Right: Instant Direct Action Buttons (ALWAYS visible without scrolling!) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* WhatsApp Quick Action */}
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition"
                    >
                      <svg className="h-3 w-3 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.961.933 3.018.933h.005c3.18 0 5.767-2.587 5.768-5.766.001-3.181-2.585-5.767-5.768-5.767zm0 10.375c-.947 0-1.874-.255-2.684-.736l-.192-.114-1.992.523.532-1.942-.125-.199c-.529-.841-.807-1.815-.807-2.82 0-2.898 2.358-5.257 5.259-5.257 2.898 0 5.257 2.359 5.257 5.258 0 2.899-2.359 5.258-5.258 5.258z" />
                      </svg>
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {/* View in Inbox */}
                  {h.channel === "email" && (
                    <Link
                      href={`/inbox?open=${h.lead_id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <span>Inbox</span>
                    </Link>
                  )}

                  {/* Open Lead */}
                  <Link
                    href={`/leads/${h.lead_id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-navy px-2.5 py-1 text-[11px] font-bold text-white hover:bg-navy-900 transition"
                  >
                    <span>Open Lead &rarr;</span>
                  </Link>

                  {/* Mark Resolved Form Action */}
                  {!isClosed ? (
                    <form action={closeHandoff}>
                      <input type="hidden" name="id" value={h.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition"
                      >
                        <span>Reopen</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Row 2: Escalation Reason & Customer Message Unified */}
              <div className="mt-2.5 rounded-lg border border-slate-200/70 bg-slate-50/80 p-2.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-navy-950">Reason:</span>
                  <span className="text-slate-800 font-medium">{h.reason}</span>
                </div>

                {h.last_message && (
                  <p className="mt-1 text-xs text-slate-600 italic bg-white p-2 rounded-md border border-slate-200/60 leading-relaxed">
                    &ldquo;{h.last_message}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {rows.length === 0 && (
          <div className="card p-8 text-center max-w-md mx-auto my-4">
            <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-navy-950">
              {f === "open"
                ? "Queue is Clear!"
                : f === "urgent"
                ? "No Urgent Escalations"
                : "No Handoffs Found"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {f === "open"
                ? "All customer conversations escalated by AI agents have been addressed."
                : `No records match the "${f}" filter.`}
            </p>
            {f !== "all" && totalCount > 0 && (
              <Link
                href="?f=all"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-gold transition"
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
