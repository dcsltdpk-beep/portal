import Sidebar from "@/components/Sidebar";
import { requireSession } from "@/lib/auth";
import { q1 } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
  const b = await q1<{ inbox: number; handoffs: number }>(
    `select (select count(*)::int from crm.emails where direction = 'in' and status in ('new','needs_human')) as inbox,
            (select count(*)::int from crm.handoffs where status = 'Open') as handoffs`);
  return (
    <div className="flex min-h-screen">
      <Sidebar name={s.name} role={s.role} badges={{ inbox: b?.inbox ?? 0, handoffs: b?.handoffs ?? 0 }} />
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
