"use client";
import { useState } from "react";
import Link from "next/link";
import { ScoreBadge, StageBadge, TempBadge } from "@/components/Badges";
import { ago, leadName } from "@/lib/format";
import type { Lead } from "@/lib/types";

export default function DashboardLeadTabs({
  hotLeads,
  followUps,
}: {
  hotLeads: Lead[];
  followUps: Lead[];
}) {
  const [tab, setTab] = useState<"hot" | "followups">("hot");

  const list = tab === "hot" ? hotLeads : followUps;

  return (
    <div className="card p-3.5 sm:p-4 shadow-xs flex flex-col justify-between h-full min-h-[350px]">
      <div>
        {/* Header with Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("hot")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              tab === "hot"
                ? "bg-navy-950 text-gold shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <span>🔥 Hot Leads (Call Today)</span>
            <span
              className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold ${
                tab === "hot" ? "bg-gold text-navy-950" : "bg-slate-200 text-slate-700"
              }`}
            >
              {hotLeads.length}
            </span>
          </button>

          <button
            onClick={() => setTab("followups")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              tab === "followups"
                ? "bg-navy-950 text-gold shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <span>⏰ Follow-ups Due (24h)</span>
            <span
              className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold ${
                tab === "followups" ? "bg-gold text-navy-950" : "bg-slate-200 text-slate-700"
              }`}
            >
              {followUps.length}
            </span>
          </button>
        </div>

        <Link
          href="/leads"
          className="text-xs font-semibold text-navy hover:text-gold-dark hover:underline flex items-center gap-1"
        >
          <span>View all leads</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* List / Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="th !bg-transparent text-[11px]">Lead Details</th>
              <th className="th !bg-transparent text-[11px]">Pipeline / Stage</th>
              <th className="th !bg-transparent text-[11px]">Score</th>
              <th className="th !bg-transparent text-[11px]">Owner</th>
              <th className="th !bg-transparent text-[11px]">{tab === "hot" ? "Last Inbound" : "Due"}</th>
              <th className="th !bg-transparent text-[11px] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((l) => {
              const initials = (l.name || l.email || "L").slice(0, 2).toUpperCase();
              return (
                <tr key={l.id} className="hover:bg-slate-50/70 transition group">
                  <td className="td py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy font-bold text-xs border border-navy-border/20 shadow-2xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/leads/${l.id}`}
                          className="font-bold text-navy-950 hover:text-gold-dark hover:underline truncate block text-xs leading-tight"
                        >
                          {leadName(l)}
                        </Link>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {l.company || l.service_interest || l.phone || l.email || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="td py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-500 capitalize">
                        {l.pipeline ?? "unsorted"}
                      </span>
                      <StageBadge stage={l.stage} />
                    </div>
                  </td>
                  <td className="td py-2.5">
                    <div className="flex items-center gap-1.5">
                      <ScoreBadge score={l.score} />
                      <TempBadge t={l.temperature} />
                    </div>
                  </td>
                  <td className="td py-2.5 text-xs text-slate-600">
                    {l.owner_name ? (
                      <span className="font-medium text-slate-700">{l.owner_name}</span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="td py-2.5 text-xs text-slate-500 whitespace-nowrap">
                    {tab === "followups" && l.next_follow_up
                      ? ago(l.next_follow_up)
                      : ago(l.last_inbound_at)}
                  </td>
                  <td className="td py-2.5 text-right">
                    <Link
                      href={`/leads/${l.id}`}
                      className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-navy hover:bg-navy hover:text-white transition shadow-2xs"
                    >
                      Open &rarr;
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {list.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400">
            {tab === "hot" ? "No hot leads to call right now." : "No follow-ups due in the next 24 hours."}
          </div>
        )}
      </div>
    </div>
  </div>
);
}
