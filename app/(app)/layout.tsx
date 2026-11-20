import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { requireSession } from "@/lib/auth";
import { q1 } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
  const b = await q1<{ inbox: number; handoffs: number }>(
    `select (select count(*)::int from crm.emails where direction = 'in' and status in ('new','needs_human')) as inbox,
            (select count(*)::int from crm.handoffs where status = 'Open') as handoffs`);

  return (
    <div className="flex min-h-screen bg-[#F4F5F8]">
      <Sidebar name={s.name} role={s.role} badges={{ inbox: b?.inbox ?? 0, handoffs: b?.handoffs ?? 0 }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav name={s.name} role={s.role} inboxCount={b?.inbox ?? 0} handoffsCount={b?.handoffs ?? 0} />
        <main className="min-w-0 flex-1 p-3 md:p-4 max-w-[1560px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
