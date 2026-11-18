"use client";
import Link from "next/link";
import { useOptimistic, useTransition, useState } from "react";
import { moveStage } from "@/lib/actions";
import { label } from "@/lib/constants";
import { ago, leadName } from "@/lib/format";
import type { Lead } from "@/lib/types";

export default function Kanban({ stages, leads }: { stages: readonly string[]; leads: Lead[] }) {
  const [, start] = useTransition();
  const [error, setError] = useState("");
  const [items, move] = useOptimistic(leads, (cur: Lead[], m: { id: string; stage: string }) =>
    cur.map((l) => (l.id === m.id ? { ...l, stage: m.stage } : l)));
  const [over, setOver] = useState<string | null>(null);

  function drop(stage: string, id: string) {
    setOver(null);
    const lead = items.find((l) => l.id === id);
    if (!lead || lead.stage === stage) return;
    setError("");
    start(async () => {
      move({ id, stage });
      try { await moveStage(id, stage); } catch (e) { setError((e as Error).message); }
    });
  }

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((st) => {
          const col = items.filter((l) => l.stage === st);
          return (
            <div key={st}
              onDragOver={(e) => { e.preventDefault(); setOver(st); }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => drop(st, e.dataTransfer.getData("text/plain"))}
              className={`flex w-64 shrink-0 flex-col rounded-xl p-2 ${over === st ? "bg-teal-100" : "bg-slate-100"}`}>
              <div className="flex items-center justify-between px-2 py-1.5">
                <h3 className="text-sm font-semibold">{label(st)}</h3>
                <span className="text-xs text-slate-500">{col.length}</span>
              </div>
              <div className="flex min-h-24 flex-col gap-2">
                {col.map((l) => (
                  <div key={l.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", l.id)}
                    className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/leads/${l.id}`} className="text-sm font-medium text-brand hover:underline">{leadName(l)}</Link>
                      <span className={`rounded-full px-1.5 text-xs font-semibold ${l.score >= 50 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>{l.score}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{l.service_interest || l.requirement_summary || "—"}</p>
                    <p className="mt-2 flex justify-between text-[11px] text-slate-400">
                      <span>{l.owner_name || "Unassigned"}</span><span>{ago(l.last_inbound_at)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
