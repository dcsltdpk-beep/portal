import Link from "next/link";
import { requireSession, leadScope } from "@/lib/auth";
import { q } from "@/lib/db";
import { ScoreBadge, StageBadge, TempBadge, PageTitle } from "@/components/Badges";
import { PIPELINES, type PipelineKey } from "@/lib/constants";
import { ago, leadName } from "@/lib/format";
import type { Lead, User } from "@/lib/types";

const PAGE = 25;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string; pipeline?: string; stage?: string; temp?: string;
    source?: string; owner?: string; sort?: string; page?: string;
  }>;
}) {
  const s = await requireSession();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PAGE;

  const scope = leadScope(s, "l", 7);
  const conds = [scope.sql];
  const params: unknown[] = [
    sp.q ? `%${sp.q.trim().toLowerCase()}%` : null,
    sp.pipeline || null,
    sp.stage || null,
    sp.temp || null,
    sp.source || null,
    sp.owner || null,
    ...scope.params,
  ];

  if (sp.q) conds.push("(lower(l.name) like $1 or lower(l.email) like $1 or l.phone like $1 or lower(l.company) like $1)");
  if (sp.pipeline) conds.push("l.pipeline = $2");
  if (sp.stage) conds.push("l.stage = $3");
  if (sp.temp) conds.push("l.temperature = $4");
  if (sp.source) conds.push("l.source = $5");
  if (sp.owner) conds.push("l.owner_id = $6::uuid");

  const order = sp.sort === "new" ? "l.created_at desc"
    : sp.sort === "activity" ? "l.last_inbound_at desc nulls last"
    : "l.score desc, l.last_inbound_at desc nulls last";

  const [leads, users] = await Promise.all([
    q<Lead>(`
      select l.*, u.name as owner_name from crm.leads l
      left join crm.users u on u.id = l.owner_id
      where ${conds.join(" and ")}
      order by ${order} limit ${PAGE} offset ${offset}
    `, params),
    q<User>("select id, name, role, email from crm.users where active order by name"),
  ]);

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
    return `?${p.toString()}`;
  };

  return (
    <>
      <PageTitle title="Leads" sub="Search and manage all potential clients and students." />

      <form className="mb-4 grid gap-2 sm:grid-cols-2 md:grid-cols-6">
        <input className="input md:col-span-2" name="q" placeholder="Search name, email, phone, company" defaultValue={sp.q} />
        <select className="input" name="pipeline" defaultValue={sp.pipeline}>
          <option value="">All pipelines</option>
          {Object.entries(PIPELINES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="input" name="temp" defaultValue={sp.temp}>
          <option value="">All temperatures</option>
          <option value="Hot">Hot</option><option value="Warm">Warm</option><option value="Cold">Cold</option>
        </select>
        <select className="input" name="owner" defaultValue={sp.owner}>
          <option value="">All owners</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <button className="btn-primary">Filter</button>
      </form>

      <div className="card overflow-x-auto shadow-xs border-slate-200">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50/70">
            <tr>
              <th className="th">Lead</th>
              <th className="th">Pipeline / stage</th>
              <th className="th">Interest</th>
              <th className="th"><Link href={qs({ sort: "" })} className="hover:text-navy">Score</Link></th>
              <th className="th">Owner</th>
              <th className="th"><Link href={qs({ sort: "activity" })} className="hover:text-navy">Last message</Link></th>
              <th className="th"><Link href={qs({ sort: "new" })} className="hover:text-navy">Created</Link></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/80 transition">
                <td className="td">
                  <Link href={`/leads/${l.id}`} className="font-semibold text-navy hover:text-gold-dark hover:underline">
                    {leadName(l)}
                  </Link>
                  <p className="text-xs text-slate-400">{[l.company, l.email, l.phone].filter(Boolean).join(" · ")}</p>
                </td>
                <td className="td">
                  <span className="mr-2 text-xs capitalize text-slate-500">{l.pipeline ?? "unsorted"}</span>
                  <StageBadge stage={l.stage} />
                </td>
                <td className="td max-w-56 truncate text-slate-600">{l.service_interest || "—"}</td>
                <td className="td"><ScoreBadge score={l.score} /> <TempBadge t={l.temperature} /></td>
                <td className="td text-slate-600">{l.owner_name || <span className="text-slate-400">—</span>}</td>
                <td className="td text-xs text-slate-500">{ago(l.last_inbound_at)}</td>
                <td className="td text-xs text-slate-500">{ago(l.created_at)}</td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td className="td text-slate-400" colSpan={7}>No leads match.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        {page > 1 && <Link className="btn-ghost" href={qs({ page: String(page - 1) })}>Previous</Link>}
        {leads.length === PAGE && <Link className="btn-ghost" href={qs({ page: String(page + 1) })}>Next</Link>}
      </div>
      {users.length === 0 && <p className="mt-4 text-sm text-amber-600">No team members yet. Add them in crm.users.</p>}
    </>
  );
}
