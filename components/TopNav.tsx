"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AutoRefresh from "@/components/AutoRefresh";

type Props = {
  name: string;
  role: string;
  inboxCount: number;
  handoffsCount: number;
};

export default function TopNav({ name, role, inboxCount, handoffsCount }: Props) {
  const path = usePathname();

  const getPageTitle = () => {
    if (path.startsWith("/dashboard")) return { title: "Dashboard", sub: "Live 360 CRM & Agent Overview" };
    if (path.startsWith("/leads/")) return { title: "Lead Profile", sub: "Activity timeline and direct actions" };
    if (path.startsWith("/leads")) return { title: "Leads Directory", sub: "Manage, filter and score inbound inquiries" };
    if (path.startsWith("/pipelines/services")) return { title: "Services Pipeline", sub: "B2B Deals and Client Engagements" };
    if (path.startsWith("/pipelines/academy")) return { title: "Academy Pipeline", sub: "Admissions, Students & Counselling" };
    if (path.startsWith("/inbox")) return { title: "Smart Inbox", sub: "AI agent drafts and Gmail interactions" };
    if (path.startsWith("/handoffs")) return { title: "Handoffs Queue", sub: "Urgent conversations escalated to team" };
    if (path.startsWith("/settings")) return { title: "CRM Settings", sub: "Scoring rules and portal configurations" };
    return { title: "DCS CRM", sub: "Dream Cyber Security" };
  };

  const { title, sub } = getPageTitle();

  return (
    <header className="sticky top-0 z-20 flex h-18 w-full items-center justify-between border-b border-slate-200/80 bg-white/85 px-6 backdrop-blur-md">
      {/* Page Title & Breadcrumb */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-navy-950">{title}</h1>
        <p className="text-xs text-slate-500 hidden sm:block">{sub}</p>
      </div>

      {/* Middle & Right Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Live Auto-Refresh sync indicator */}
        <AutoRefresh intervalMs={15000} />

        {/* Quick Search Shortcut */}
        <Link
          href="/leads"
          className="hidden md:flex items-center gap-2 rounded-xl bg-slate-100/90 px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 transition border border-slate-200/60"
        >
          <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search leads, emails...</span>
          <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-400 shadow-2xs">/leads</kbd>
        </Link>

        {/* Quick Action Alerts */}
        <Link
          href="/inbox"
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            inboxCount > 0
              ? "bg-amber-50 text-amber-900 border border-gold/30 hover:bg-amber-100"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <svg className="h-4 w-4 text-gold-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Inbox</span>
          {inboxCount > 0 && (
            <span className="rounded-full bg-gold px-1.5 py-0.2 text-[10px] font-bold text-navy-950">
              {inboxCount}
            </span>
          )}
        </Link>

        <Link
          href="/handoffs"
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            handoffsCount > 0
              ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <svg className={`h-4 w-4 ${handoffsCount > 0 ? "text-red-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="hidden sm:inline">Handoffs</span>
          {handoffsCount > 0 && (
            <span className="rounded-full bg-red-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
              {handoffsCount}
            </span>
          )}
        </Link>

        {/* User Badge / Status Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-navy to-navy-light text-xs font-bold text-gold shadow-2xs">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-navy-950 leading-tight truncate max-w-28">{name}</p>
            <p className="text-[10px] capitalize font-medium text-slate-400">{role.replace("_", " ")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
