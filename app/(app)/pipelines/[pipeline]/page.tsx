import { notFound } from "next/navigation";
import { requireSession, leadScope } from "@/lib/auth";
import { q } from "@/lib/db";
import { PIPELINES, type PipelineKey } from "@/lib/constants";
import { PageTitle } from "@/components/Badges";
import Kanban from "@/components/Kanban";
import type { Lead } from "@/lib/types";

export default async function PipelinePage({ params }: { params: Promise<{ pipeline: string }> }) {
  const s = await requireSession();
  const { pipeline } = await params;
  if (!(pipeline in PIPELINES)) notFound();
  const p = PIPELINES[pipeline as PipelineKey];
  const scope = leadScope(s, "l", 2);
  // closed leads only show if they moved in the last 30 days, so the board stays readable
  const leads = await q<Lead>(
    `select l.*, u.name as owner_name from crm.leads l left join crm.users u on u.id = l.owner_id
      where l.pipeline = $1 and ${scope.sql}
        and (l.stage not in ('won','lost','enrolled') or l.updated_at > now() - interval '30 days')
      order by l.score desc, l.updated_at desc limit 500`, [pipeline, ...scope.params]);
  return (
    <>
      <PageTitle title={p.label} sub="Drag a card to change its stage. Won, lost and enrolled show for 30 days." />
      <Kanban stages={p.stages} leads={leads} />
    </>
  );
}
