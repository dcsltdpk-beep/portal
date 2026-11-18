"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/pipelines/services", label: "Services pipeline" },
  { href: "/pipelines/academy", label: "Academy pipeline" },
  { href: "/inbox", label: "Inbox", badgeKey: "inbox" },
  { href: "/handoffs", label: "Handoffs", badgeKey: "handoffs" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar({ name, role, badges }: { name: string; role: string; badges: Record<string, number> }) {
  const path = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-ink text-slate-300">
      <div className="px-5 py-5">
        <p className="text-[10px] font-semibold tracking-widest text-teal-400">DREAM CYBER SECURITY</p>
        <p className="text-lg font-bold text-white">CRM Portal</p>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map((n) => {
          const active = path === n.href || path.startsWith(n.href + "/");
          const count = n.badgeKey ? badges[n.badgeKey] : 0;
          return (
            <Link key={n.href} href={n.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${active ? "bg-white/10 text-white" : "hover:bg-white/5"}`}>
              {n.label}
              {count > 0 && <span className="rounded-full bg-teal-500 px-2 text-xs font-semibold text-white">{count}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-5 py-4 text-sm">
        <p className="font-medium text-white">{name}</p>
        <p className="text-xs capitalize text-slate-400">{role.replace("_", " ")}</p>
        <form action="/logout" method="post"><button className="mt-2 text-xs text-teal-400 hover:underline">Sign out</button></form>
      </div>
    </aside>
  );
}
