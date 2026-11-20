"use client";
import Link from "next/link";
import { useOptimistic, useTransition, useState } from "react";
import { moveStage } from "@/lib/actions";
import { label } from "@/lib/constants";
import { ago, leadName } from "@/lib/format";
import type { Lead } from "@/lib/types";

type StageTheme = {
  topBorder: string;
  bg: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  headerDot: string;
  cardBorder: string;
  pillBg: string;
  pillText: string;
};

const DEFAULT_THEME: StageTheme = {
  topBorder: "border-t-slate-400",
  bg: "bg-slate-50/70",
  borderColor: "border-slate-200/80",
  badgeBg: "bg-slate-600",
  badgeText: "text-white",
  headerDot: "bg-slate-400",
  cardBorder: "border-l-slate-400",
  pillBg: "bg-slate-100",
  pillText: "text-slate-700",
};

const STAGE_THEMES: Record<string, StageTheme> = {
  // Services Pipeline Stages
  new: {
    topBorder: "border-t-blue-500",
    bg: "bg-blue-50/25",
    borderColor: "border-blue-200/90",
    badgeBg: "bg-blue-600",
    badgeText: "text-white",
    headerDot: "bg-blue-500",
    cardBorder: "border-l-blue-500",
    pillBg: "bg-blue-50 text-blue-800 border-blue-200",
    pillText: "text-blue-900",
  },
  contacted: {
    topBorder: "border-t-indigo-500",
    bg: "bg-indigo-50/25",
    borderColor: "border-indigo-200/90",
    badgeBg: "bg-indigo-600",
    badgeText: "text-white",
    headerDot: "bg-indigo-500",
    cardBorder: "border-l-indigo-500",
    pillBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
    pillText: "text-indigo-900",
  },
  qualified: {
    topBorder: "border-t-[#FBAE44]",
    bg: "bg-amber-50/30",
    borderColor: "border-amber-300/90",
    badgeBg: "bg-[#FBAE44]",
    badgeText: "text-navy-950 font-black",
    headerDot: "bg-[#FBAE44]",
    cardBorder: "border-l-[#FBAE44]",
    pillBg: "bg-amber-50 text-amber-900 border-amber-300",
    pillText: "text-amber-950",
  },
  call_booked: {
    topBorder: "border-t-teal-500",
    bg: "bg-teal-50/25",
    borderColor: "border-teal-200/90",
    badgeBg: "bg-teal-600",
    badgeText: "text-white",
    headerDot: "bg-teal-500",
    cardBorder: "border-l-teal-500",
    pillBg: "bg-teal-50 text-teal-800 border-teal-200",
    pillText: "text-teal-900",
  },
  proposal_sent: {
    topBorder: "border-t-orange-500",
    bg: "bg-orange-50/25",
    borderColor: "border-orange-200/90",
    badgeBg: "bg-orange-600",
    badgeText: "text-white",
    headerDot: "bg-orange-500",
    cardBorder: "border-l-orange-500",
    pillBg: "bg-orange-50 text-orange-800 border-orange-200",
    pillText: "text-orange-900",
  },
  negotiation: {
    topBorder: "border-t-purple-600",
    bg: "bg-purple-50/25",
    borderColor: "border-purple-200/90",
    badgeBg: "bg-purple-600",
    badgeText: "text-white",
    headerDot: "bg-purple-600",
    cardBorder: "border-l-purple-600",
    pillBg: "bg-purple-50 text-purple-800 border-purple-200",
    pillText: "text-purple-900",
  },
  won: {
    topBorder: "border-t-emerald-500",
    bg: "bg-emerald-50/35",
    borderColor: "border-emerald-300/90",
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    headerDot: "bg-emerald-500",
    cardBorder: "border-l-emerald-500",
    pillBg: "bg-emerald-50 text-emerald-800 border-emerald-300",
    pillText: "text-emerald-950",
  },
  lost: {
    topBorder: "border-t-slate-400",
    bg: "bg-slate-100/60",
    borderColor: "border-slate-200/90",
    badgeBg: "bg-slate-500",
    badgeText: "text-white",
    headerDot: "bg-slate-400",
    cardBorder: "border-l-slate-400",
    pillBg: "bg-slate-100 text-slate-700 border-slate-200",
    pillText: "text-slate-800",
  },

  // Academy Pipeline Stages
  inquiry: {
    topBorder: "border-t-blue-500",
    bg: "bg-blue-50/25",
    borderColor: "border-blue-200/90",
    badgeBg: "bg-blue-600",
    badgeText: "text-white",
    headerDot: "bg-blue-500",
    cardBorder: "border-l-blue-500",
    pillBg: "bg-blue-50 text-blue-800 border-blue-200",
    pillText: "text-blue-900",
  },
  details_sent: {
    topBorder: "border-t-indigo-500",
    bg: "bg-indigo-50/25",
    borderColor: "border-indigo-200/90",
    badgeBg: "bg-indigo-600",
    badgeText: "text-white",
    headerDot: "bg-indigo-500",
    cardBorder: "border-l-indigo-500",
    pillBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
    pillText: "text-indigo-900",
  },
  demo_counselling: {
    topBorder: "border-t-teal-500",
    bg: "bg-teal-50/25",
    borderColor: "border-teal-200/90",
    badgeBg: "bg-teal-600",
    badgeText: "text-white",
    headerDot: "bg-teal-500",
    cardBorder: "border-l-teal-500",
    pillBg: "bg-teal-50 text-teal-800 border-teal-200",
    pillText: "text-teal-900",
  },
  fee_pending: {
    topBorder: "border-t-amber-500",
    bg: "bg-amber-50/30",
    borderColor: "border-amber-300/90",
    badgeBg: "bg-amber-500",
    badgeText: "text-navy-950 font-black",
    headerDot: "bg-amber-500",
    cardBorder: "border-l-amber-500",
    pillBg: "bg-amber-50 text-amber-900 border-amber-300",
    pillText: "text-amber-950",
  },
  enrolled: {
    topBorder: "border-t-emerald-500",
    bg: "bg-emerald-50/35",
    borderColor: "border-emerald-300/90",
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    headerDot: "bg-emerald-500",
    cardBorder: "border-l-emerald-500",
    pillBg: "bg-emerald-50 text-emerald-800 border-emerald-300",
    pillText: "text-emerald-950",
  },
};

export default function Kanban({ stages, leads }: { stages: readonly string[]; leads: Lead[] }) {
  const [, start] = useTransition();
  const [error, setError] = useState("");
  const [items, move] = useOptimistic(leads, (cur: Lead[], m: { id: string; stage: string }) =>
    cur.map((l) => (l.id === m.id ? { ...l, stage: m.stage } : l))
  );
  const [over, setOver] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"fit" | "scroll" | "table">("fit");
  const [search, setSearch] = useState("");

  function drop(stage: string, id: string) {
    setOver(null);
    const lead = items.find((l) => l.id === id);
    if (!lead || lead.stage === stage) return;
    setError("");
    start(async () => {
      move({ id, stage });
      try {
        await moveStage(id, stage);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  // Filter items by search in table view
  const filteredItems = items.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (l.name && l.name.toLowerCase().includes(s)) ||
      (l.email && l.email.toLowerCase().includes(s)) ||
      (l.company && l.company.toLowerCase().includes(s)) ||
      (l.service_interest && l.service_interest.toLowerCase().includes(s))
    );
  });

  const totalLeads = items.length;

  return (
    <div className="space-y-3.5">
      {error && (
        <p className="text-sm font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
          {error}
        </p>
      )}

      {/* Control Bar: Pipeline Funnel Stats + View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        {/* Stage Funnel Summary Bar with distinct stage colors */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto text-xs py-0.5">
          {stages.map((st, idx) => {
            const count = items.filter((l) => l.stage === st).length;
            const theme = STAGE_THEMES[st] ?? DEFAULT_THEME;
            return (
              <div key={st} className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 font-bold border transition shadow-2xs ${
                    count > 0
                      ? `${theme.pillBg} shadow-xs`
                      : "bg-white text-slate-400 border-slate-200/70"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${theme.headerDot}`} />
                  <span>{label(st)}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      count > 0 ? `${theme.badgeBg} ${theme.badgeText}` : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </span>
                {idx < stages.length - 1 && (
                  <span className="text-slate-300 font-bold text-xs">›</span>
                )}
              </div>
            );
          })}
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("fit")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                viewMode === "fit"
                  ? "bg-white text-navy-950 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Fit all columns on screen without sideways scrolling"
            >
              <svg className="h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path strokeLinecap="round" d="M9 3v18M15 3v18" />
              </svg>
              <span>Fit Screen</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("scroll")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                viewMode === "scroll"
                  ? "bg-white text-navy-950 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Wide cards with horizontal scroll"
            >
              <svg className="h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Scroll</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                viewMode === "table"
                  ? "bg-white text-navy-950 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table list view"
            >
              <svg className="h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: FIT SCREEN (Zero Horizontal Scroll + Colored Columns & Cards) */}
      {viewMode === "fit" && (
        <div
          className={`grid gap-2.5 ${
            stages.length <= 6
              ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
              : "grid-cols-2 sm:grid-cols-4 xl:grid-cols-8"
          }`}
        >
          {stages.map((st) => {
            const col = items.filter((l) => l.stage === st);
            const theme = STAGE_THEMES[st] ?? DEFAULT_THEME;

            return (
              <div
                key={st}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(st);
                }}
                onDragLeave={() => setOver(null)}
                onDrop={(e) => drop(st, e.dataTransfer.getData("text/plain"))}
                className={`flex flex-col rounded-xl p-2 transition min-h-[380px] border-t-4 ${theme.topBorder} ${theme.bg} ${theme.borderColor} border shadow-2xs ${
                  over === st ? "ring-2 ring-gold bg-amber-50 shadow-md" : ""
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2 px-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`h-2.5 w-2.5 rounded-full ${theme.headerDot} shrink-0`} />
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-navy-950 truncate" title={label(st)}>
                      {label(st)}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black shadow-2xs ${
                      col.length > 0
                        ? `${theme.badgeBg} ${theme.badgeText}`
                        : "bg-white text-slate-500 border border-slate-200/80"
                    }`}
                  >
                    {col.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex flex-1 flex-col gap-2">
                  {col.map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", l.id)}
                      className={`group cursor-grab rounded-xl border border-slate-200/90 border-l-4 ${theme.cardBorder} bg-white p-2.5 shadow-xs hover:shadow-md hover:border-navy-border/40 transition active:cursor-grabbing`}
                    >
                      {/* Card Title & Score */}
                      <div className="flex items-start justify-between gap-1.5">
                        <Link
                          href={`/leads/${l.id}`}
                          className="text-xs font-bold text-navy-950 hover:text-gold hover:underline truncate leading-snug"
                          title={leadName(l)}
                        >
                          {leadName(l)}
                        </Link>
                        <span
                          className={`shrink-0 rounded-full px-1.5 text-[10px] font-extrabold ${
                            l.score >= 50
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : l.score >= 25
                              ? "bg-amber-50 text-amber-800 border border-gold/40"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {l.score}
                        </span>
                      </div>

                      {/* Service / Requirement Pill */}
                      {(l.service_interest || l.requirement_summary) && (
                        <div className="mt-1.5">
                          <span className="inline-block max-w-full truncate rounded bg-navy-50/70 border border-navy-border/20 px-1.5 py-0.5 text-[10px] font-semibold text-navy">
                            {l.service_interest || l.requirement_summary}
                          </span>
                        </div>
                      )}

                      {/* Card Footer: Owner & Time */}
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
                        <span className="truncate max-w-[70px] font-medium text-slate-600">
                          {l.owner_name || "Unassigned"}
                        </span>
                        <span className="shrink-0">{ago(l.last_inbound_at)}</span>
                      </div>
                    </div>
                  ))}

                  {col.length === 0 && (
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300/80 p-2 text-center text-[10px] text-slate-400 font-medium">
                      Drag here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 2: WIDE SCROLL (Horizontal Scroll Mode with Full Color Styling) */}
      {viewMode === "scroll" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map((st) => {
            const col = items.filter((l) => l.stage === st);
            const theme = STAGE_THEMES[st] ?? DEFAULT_THEME;

            return (
              <div
                key={st}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(st);
                }}
                onDragLeave={() => setOver(null)}
                onDrop={(e) => drop(st, e.dataTransfer.getData("text/plain"))}
                className={`flex w-64 shrink-0 flex-col rounded-xl p-2.5 transition border-t-4 ${theme.topBorder} ${theme.bg} ${theme.borderColor} border shadow-2xs ${
                  over === st ? "ring-2 ring-gold bg-amber-50 shadow-md" : ""
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2 px-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`h-2.5 w-2.5 rounded-full ${theme.headerDot} shrink-0`} />
                    <h3 className="text-xs font-black uppercase tracking-wider text-navy-950 truncate">{label(st)}</h3>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-black shadow-2xs ${theme.badgeBg} ${theme.badgeText}`}>
                    {col.length}
                  </span>
                </div>
                <div className="flex min-h-24 flex-col gap-2">
                  {col.map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", l.id)}
                      className={`cursor-grab rounded-xl border border-slate-200/90 border-l-4 ${theme.cardBorder} bg-white p-3 shadow-xs hover:shadow-md hover:border-navy-border/40 transition active:cursor-grabbing`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/leads/${l.id}`}
                          className="text-sm font-bold text-navy-950 hover:text-gold hover:underline leading-snug truncate"
                        >
                          {leadName(l)}
                        </Link>
                        <span
                          className={`rounded-full px-1.5 text-xs font-extrabold ${
                            l.score >= 50
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : l.score >= 25
                              ? "bg-amber-50 text-amber-800 border border-gold/40"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {l.score}
                        </span>
                      </div>
                      {(l.service_interest || l.requirement_summary) && (
                        <div className="mt-1.5">
                          <span className="inline-block max-w-full truncate rounded bg-navy-50/70 border border-navy-border/20 px-2 py-0.5 text-xs font-semibold text-navy">
                            {l.service_interest || l.requirement_summary}
                          </span>
                        </div>
                      )}
                      <p className="mt-2 flex justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-1.5">
                        <span className="font-medium text-slate-600">{l.owner_name || "Unassigned"}</span>
                        <span>{ago(l.last_inbound_at)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 3: TABLE VIEW (Fast List with Inline Stage Selector) */}
      {viewMode === "table" && (
        <div className="card overflow-hidden shadow-xs">
          <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-slate-50/50">
            <input
              type="text"
              placeholder="Search leads in this pipeline..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input max-w-sm text-xs bg-white"
            />
            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredItems.length} of {totalLeads} leads
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3">Lead Name</th>
                  <th className="p-3">Requirement</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Last Inbound</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((l) => {
                  const theme = STAGE_THEMES[l.stage || ""] ?? DEFAULT_THEME;
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <Link href={`/leads/${l.id}`} className="font-bold text-navy hover:text-gold hover:underline">
                          {leadName(l)}
                        </Link>
                        {l.email && <p className="text-[11px] text-slate-400">{l.email}</p>}
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-600">
                        {l.service_interest || l.requirement_summary || "—"}
                      </td>
                      <td className="p-3">
                        <select
                          value={l.stage || ""}
                          onChange={(e) => drop(e.target.value, l.id)}
                          className={`rounded-lg border px-2 py-1 text-xs font-bold shadow-2xs focus:outline-none ${theme.pillBg}`}
                        >
                          {stages.map((st) => (
                            <option key={st} value={st}>
                              {label(st)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 font-bold ${
                            l.score >= 50
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : l.score >= 25
                              ? "bg-amber-50 text-amber-800 border border-gold/40"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {l.score}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{l.owner_name || "Unassigned"}</td>
                      <td className="p-3 text-slate-400">{ago(l.last_inbound_at)}</td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/leads/${l.id}`}
                          className="rounded-lg bg-navy px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-navy-900 transition"
                        >
                          Open &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No leads match your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
