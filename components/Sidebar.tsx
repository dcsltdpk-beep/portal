"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/leads",
    label: "Leads",
    icon: (
      <svg className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    href: "/pipelines/services",
    label: "Services Pipeline",
    shortLabel: "Services",
    icon: (
      <svg className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/pipelines/academy",
    label: "Academy Pipeline",
    shortLabel: "Academy",
    icon: (
      <svg className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
  },
  {
    href: "/inbox",
    label: "Inbox",
    badgeKey: "inbox",
    icon: (
      <svg className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/handoffs",
    label: "Handoffs",
    badgeKey: "handoffs",
    icon: (
      <svg className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar({
  name,
  role,
  badges,
}: {
  name: string;
  role: string;
  badges: Record<string, number>;
}) {
  const path = usePathname();
  // Default to collapsed slim icon rail mode as requested by user
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside
      className={`sticky top-0 h-screen shrink-0 flex flex-col justify-between bg-navy-950 text-slate-300 border-r border-navy-border/25 z-40 select-none transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Header & Logo */}
      <div className="flex items-center justify-between px-3.5 py-4 border-b border-navy-border/25 bg-navy-900/30">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0 group mx-auto">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/6 p-1 transition-transform group-hover:scale-105 duration-300 shadow-inner border border-white/10">
            <Image
              src="/logo.png"
              alt="Dream Cyber Security Logo"
              width={34}
              height={34}
              className="h-8 w-8 object-contain drop-shadow"
              priority
              unoptimized
            />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden transition-all duration-300">
              <p className="text-[10px] font-extrabold tracking-widest text-gold uppercase truncate">DREAM CYBER</p>
              <p className="text-base font-extrabold text-white tracking-tight leading-tight">CRM Portal</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links with animated tab-switch and tooltips */}
      <nav className="flex-1 space-y-1.5 px-2.5 py-4 no-scrollbar overflow-y-auto">
        {!collapsed && (
          <p className="px-3 pb-1 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
            Menu
          </p>
        )}

        {NAV.map((n) => {
          const active = path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href));
          const count = n.badgeKey ? badges[n.badgeKey] : 0;

          return (
            <div key={n.href} className="relative group">
              <Link
                href={n.href}
                className={`relative flex items-center rounded-2xl transition-all duration-300 ${
                  collapsed
                    ? `h-12 w-12 mx-auto justify-center ${
                        active
                          ? "bg-white/15 text-gold shadow-lg backdrop-blur-md border border-white/20 animate-tab-switch"
                          : "text-slate-400 hover:bg-white/8 hover:text-white"
                      }`
                    : `px-3.5 py-2.5 justify-between ${
                        active
                          ? "bg-gradient-to-r from-navy-surface to-navy-card text-gold shadow-sm border border-gold/30 font-bold animate-tab-switch"
                          : "text-slate-300 hover:bg-white/6 hover:text-white font-medium"
                      }`
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`transition-colors duration-200 ${
                      active ? "text-gold" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    {n.icon}
                  </span>

                  {!collapsed && (
                    <span className="text-xs tracking-wide truncate">{n.label}</span>
                  )}
                </div>

                {/* Animated Glowing Active Dot Indicator (As seen in the screenshot!) */}
                {active && (
                  <span
                    className={`absolute rounded-full bg-gold shadow-[0_0_10px_rgba(251,174,68,0.9)] animate-dot-pulse transition-all ${
                      collapsed
                        ? "-right-1 top-2 h-2.5 w-2.5 border-2 border-navy-950"
                        : "right-3 h-2 w-2"
                    }`}
                  />
                )}

                {/* Notification Badge */}
                {count > 0 && !active && (
                  <span
                    className={`rounded-full bg-gold px-1.5 py-0.2 text-[10px] font-extrabold text-navy-950 shadow-2xs ${
                      collapsed ? "absolute -top-1 -right-1" : ""
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>

              {/* Floating Tooltip in Collapsed Rail Mode (Figma / Slack style) */}
              {collapsed && (
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden md:group-hover:flex items-center z-50 rounded-xl bg-navy-900/95 border border-gold/30 px-3 py-1.5 text-xs font-bold text-white shadow-2xl backdrop-blur-md whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-1 transition-all duration-200">
                  <span>{n.label}</span>
                  {count > 0 && (
                    <span className="ml-2 rounded-full bg-gold px-1.5 py-0.2 text-[10px] font-extrabold text-navy-950">
                      {count}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Expand/Collapse subtle toggle bar */}
      <div className="px-3 py-1 border-t border-navy-border/20 flex justify-center">
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse to icon rail"}
          className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 hover:text-gold hover:bg-white/10 transition-colors"
        >
          <svg
            className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Bottom Profile Section */}
      <div className="border-t border-navy-border/25 bg-navy-900/50 p-3">
        <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "justify-between"}`}>
          {/* Avatar with live status dot */}
          <div className="relative group cursor-pointer" title={name}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-navy-card to-navy-surface border border-gold/40 text-xs font-black text-gold shadow-md group-hover:scale-105 transition-transform">
              {name.charAt(0).toUpperCase()}
            </div>
            {/* Live active dot */}
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-navy-950 shadow-2xs" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1 px-2.5">
              <p className="font-bold text-white text-xs truncate leading-tight">{name}</p>
              <p className="text-[10px] capitalize text-gold/80 truncate font-semibold">{role.replace("_", " ")}</p>
            </div>
          )}

          {/* Logout Action Button */}
          <form action="/logout" method="post">
            <button
              title="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
