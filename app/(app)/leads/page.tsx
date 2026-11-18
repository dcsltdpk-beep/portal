import Link from "next/link";
import { requireSession, leadScope } from "@/lib/auth";
import { q } from "@/lib/db";
import { ScoreBadge, StageBadge, TempBadge, PageTitle } from "@/components/Badges";
import { ago, leadName } from "@/lib/format";
import type { Lead, User } from "@/lib/types";

type SP = { q?: string; pipeline?: string; temp?: string; owner?: string; source?: string; sort?: string; page?: string };
const PAGE = 50;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const scope = leadScope(s, "l", 1);
  const where = [scope.sql];
  const params: unknown[] = [...scope.params];
  const add = (sql: string, v: unknown) => { params.push(v); where.push(sql.replace("?", `$${params.length}`)); };

  if (sp.q) {
    params.push(`%${sp.q}%`);
    const n = `$${params.length}`;
    where.push(`(l.name ilike ${n} or l.email ilike ${n} or l.phone ilike ${n} or l.company ilike ${n})`);
  }
  if (sp.pipeline) add("l.pipeline = ?", sp.pipeline);
  if (sp.temp) add("l.temperature = ?", sp.temp);
  if (sp.source) add("l.source = ?", sp.source);
  if (sp.owner === "me") add("l.owner_id = ?", s.uid);
  if (sp.owner === "none") where.push("l.owner_id is null");

  const order = sp.sort === "new" ? "l.created_at desc" : sp.sort === "activity" ? "l.last_inbound_at desc nulls last" : "l.score desc, l.updated_at desc";
  const page = Math.max(1, Number(sp.page) || 1);

  const leads = await q<Lead>(
    `select l.*, u.name as owner_name from crm.leads l left join crm.users u on u.id = l.owner_id
      where ${where.join(" and ")} order by ${order} limit ${PAGE} offset ${(page - 1) * PAGE}`, params);
  const users = await q<User>("select id, name, role, email from crm.users where active order by name");
  const sources = await q<{ source: string }>("select distinct source from crm.leads where source is not null order by 1");

  const qs = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `?${p.toString()}`;
  };

  return (
    <>
      <PageTitle title="Leads" sub={`${leads.length} shown`} />
      <form className="card mb-4 grid grid-cols-2 gap-3 p-3 md:grid-cols-6">
        <input className="input md:col-span-2" name="q" placeholder="Search name, email, phone, company" defaultValue={sp.q} />
        <select className="input" name="pipeline" defaultValue={sp.pipeline}>
          <option value="">All pipelines</option><option value="services">Services</option><option value="academy">Academy</option><option value="client">Client</option>
        </select>
        <select className="input" name="temp" defaultValue={sp.temp}>
          <option value="">Any temperature</option><option>Hot</option><option>Warm</option><option>Cold</option>
        </select>
        <select className="input" name="source" defaultValue={sp.source}>
          <option value="">All sources</option>{sources.map((x) => <option key={x.source}>{x.source}</option>)}
        </select>
        <div className="flex gap-2">
          <select className="input" name="owner" defaultValue={sp.owner}>
            <option value="">Any owner</option><option value="me">Mine</option><option value="none">Unassigned</option>
          </select>
          <button className="btn-primary">Filter</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th">Lead</th><th className="th">Pipeline / stage</th><th className="th">Interest</th>
              <th className="th"><Link href={qs({ sort: "" })}>Score</Link></th><th className="th">Owner</th>
              <th className="th"><Link href={qs({ sort: "activity" })}>Last message</Link></th>
              <th className="th"><Link href={qs({ sort: "new" })}>Created</Link></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="td">
                  <Link href={`/leads/${l.id}`} className="font-medium text-brand hover:underline">{leadName(l)}</Link>
                  <p className="text-xs text-slate-400">{[l.company, l.email, l.phone].filter(Boolean).join(" · ")}</p>
                </td>
                <td className="td"><span className="mr-2 text-xs capitalize text-slate-500">{l.pipeline ?? "unsorted"}</span><StageBadge stage={l.stage} /></td>
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
      <div className="mt-3 flex justify-end gap-2">
        {page > 1 && <Link className="btn-ghost" href={qs({ page: String(page - 1) })}>Previous</Link>}
        {leads.length === PAGE && <Link className="btn-ghost" href={qs({ page: String(page + 1) })}>Next</Link>}
      </div>
      {users.length === 0 && <p className="mt-4 text-sm text-amber-600">No team members yet. Add them in crm.users.</p>}
    </>
  );
}
