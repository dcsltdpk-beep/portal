import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { q } from "@/lib/db";
import { PageTitle } from "@/components/Badges";
import { closeHandoff } from "@/lib/actions";
import { ago } from "@/lib/format";

type H = { id: number; lead_id: string; lead_name: string | null; email: string | null; phone: string | null; channel: string;
  reason: string; last_message: string | null; priority: string; status: string; created_at: string };

export default async function HandoffsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireSession();
  const { show } = await searchParams;
  const rows = await q<H>(
    `select h.*, l.name as lead_name, l.email, l.phone from crm.handoffs h join crm.leads l on l.id = h.lead_id
      where ${show === "closed" ? "h.status = 'Closed'" : "h.status <> 'Closed'"}
      order by (h.priority = 'Urgent') desc, h.created_at desc limit 200`);
  return (
    <>
      <PageTitle title="Handoffs" sub="Conversations the AI passed to the team.">
        <Link className="btn-ghost" href={show === "closed" ? "/handoffs" : "?show=closed"}>{show === "closed" ? "Show open" : "Show closed"}</Link>
      </PageTitle>
      <div className="space-y-3">
        {rows.map((h) => (
          <div key={h.id} className={`card flex flex-wrap items-start justify-between gap-4 p-4 ${h.priority === "Urgent" && h.status !== "Closed" ? "border-red-300 bg-red-50" : ""}`}>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className={`mr-2 rounded px-1.5 py-0.5 text-xs font-semibold ${h.priority === "Urgent" ? "bg-red-600 text-white" : "bg-slate-200"}`}>{h.priority}</span>
                <Link href={`/leads/${h.lead_id}`} className="font-medium text-brand hover:underline">{h.lead_name || h.email || h.phone}</Link>
                <span className="ml-2 text-xs text-slate-500">{h.channel} · {ago(h.created_at)}</span>
              </p>
              <p className="mt-1 font-medium">{h.reason}</p>
              {h.last_message && <p className="mt-1 text-sm text-slate-600">&ldquo;{h.last_message}&rdquo;</p>}
            </div>
            {h.status !== "Closed" && (
              <form action={closeHandoff}><input type="hidden" name="id" value={h.id} /><button className="btn-ghost">Mark done</button></form>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-400">Nothing here.</p>}
      </div>
    </>
  );
}
