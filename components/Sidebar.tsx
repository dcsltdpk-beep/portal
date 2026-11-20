"use client";
import Image from "next/image";
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
    <aside className="flex w-64 shrink-0 flex-col bg-navy-950 text-slate-300 border-r border-navy-border/40">
      {/* Brand Header with Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-navy-border/30 bg-navy-900/40">
        <Image
          src="/logo.png"
          alt="Dream Cyber Security Logo"
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 object-contain drop-shadow"
          priority
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-widest text-gold uppercase truncate">DREAM CYBER SECURITY</p>
          <p className="text-base font-bold text-white tracking-tight">CRM Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((n) => {
          const active = path === n.href || path.startsWith(n.href + "/");
          const count = n.badgeKey ? badges[n.badgeKey] : 0;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-navy-surface text-gold font-semibold shadow-sm border border-gold/25"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{n.label}</span>
              {count > 0 && (
                <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-navy-950 shadow-xs">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile & Logout */}
      <div className="border-t border-navy-border/40 bg-navy-900/60 px-5 py-4 text-sm">
        <p className="font-semibold text-white truncate">{name}</p>
        <p className="text-xs capitalize text-gold/80">{role.replace("_", " ")}</p>
        <form action="/logout" method="post">
          <button className="mt-2 text-xs font-medium text-slate-400 hover:text-gold transition underline-offset-2 hover:underline">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
