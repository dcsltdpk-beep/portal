"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  badgeKey?: string;
  icon: (active: boolean) => React.ReactNode;
}

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (active) => (
      <svg className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/leads",
    label: "Leads",
    icon: (active) => (
      <svg className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="10" r="3" />
        <path strokeLinecap="round" d="M6.5 18a5.5 5.5 0 0111 0" />
      </svg>
    ),
  },
  {
    href: "/pipelines/services",
    label: "Services Pipeline",
    icon: (active) => (
      <svg className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  },
  {
    href: "/pipelines/academy",
    label: "Academy Pipeline",
    icon: (active) => (
      <svg className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path strokeLinecap="round" d="M16 2v4M8 2v4M3 9.5h18" />
        <circle cx="8" cy="13.5" r="1" fill="currentColor" />
        <circle cx="12" cy="13.5" r="1" fill="currentColor" />
        <circle cx="16" cy="13.5" r="1" fill="currentColor" />
        <circle cx="8" cy="17" r="1" fill="currentColor" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/inbox",
    label: "Inbox",
    badgeKey: "inbox",
    icon: (active) => (
      <svg className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: "/handoffs",
    label: "Handoffs",
    badgeKey: "handoffs",
    icon: (active) => (
      <svg className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M3.6 9h16.8M3.6 15h16.8" />
        <path strokeLinecap="round" d="M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (active) => (
      <svg className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

const ITEM_HEIGHT = 54; // vertical distance between nav item centers in px

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
  const [, startTransition] = useTransition();

  // Find active navigation item index
  const activeIndex = NAV.findIndex((n) => {
    if (n.href === "/dashboard") return path === "/dashboard";
    return path.startsWith(n.href);
  });

  const effectiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const [optimisticIndex, setOptimisticIndex] = useState<number | null>(null);

  // If user clicks a tab, immediately slide the pill optimistically
  const currentIndex = optimisticIndex !== null ? optimisticIndex : effectiveIndex;

  return (
    <aside className="sticky top-0 h-screen w-[84px] shrink-0 flex flex-col justify-between bg-[#121028] text-slate-300 border-r border-[#201C46] z-40 select-none no-scrollbar shadow-[4px_0_30px_rgba(0,0,0,0.25)]">
      {/* Top Header Logo */}
      <div className="pt-5 pb-3 flex justify-center items-center">
        <Link
          href="/dashboard"
          onClick={() => setOptimisticIndex(0)}
          className="relative group flex items-center justify-center"
        >
          {/* Logo container with ambient glow */}
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 p-1.5 transition-all duration-300 group-hover:scale-105 group-hover:bg-white/10 group-hover:shadow-[0_0_20px_rgba(251,174,68,0.35)] border border-white/10">
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
        </Link>
      </div>

      {/* Navigation Links with Fluid Sliding Capsule Pill */}
      <div className="relative flex-1 flex flex-col justify-center py-2">
        <nav className="relative flex flex-col items-center">
          {/* THE SLIDING CAPSULE PILL (Exactly matches user's reference image!) */}
          <div
            className="absolute left-1.5 pointer-events-none transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-10"
            style={{
              transform: `translateY(${currentIndex * ITEM_HEIGHT}px)`,
              height: "46px",
              width: "75px",
            }}
          >
            <div className="relative h-full w-full rounded-full bg-[#757470]/50 backdrop-blur-xl border border-white/20 shadow-[0_6px_22px_rgba(0,0,0,0.45)] flex items-center justify-end pr-2.5">
              {/* Solid White Glowing Dot on the right edge */}
              <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] animate-pulse" />
            </div>
          </div>

          {/* Navigation Items */}
          <div className="relative z-20 flex flex-col">
            {NAV.map((n, idx) => {
              const active = currentIndex === idx;
              const count = n.badgeKey ? badges[n.badgeKey] : 0;

              return (
                <div key={n.href} className="relative group flex items-center justify-center" style={{ height: `${ITEM_HEIGHT}px` }}>
                  <Link
                    href={n.href}
                    onClick={() => {
                      startTransition(() => {
                        setOptimisticIndex(idx);
                      });
                    }}
                    className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ${
                      active ? "text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {n.icon(active)}

                    {/* Unread count badge if not active */}
                    {count > 0 && !active && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-black text-navy-950 shadow-md">
                        {count}
                      </span>
                    )}
                  </Link>

                  {/* Floating Glass Tooltip on Hover (slides out to the right) */}
                  <div className="pointer-events-none absolute left-[88px] top-1/2 -translate-y-1/2 hidden md:group-hover:flex items-center z-50 rounded-xl bg-[#1A163D]/95 border border-gold/40 px-3 py-1.5 text-xs font-bold text-white shadow-2xl backdrop-blur-md whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-200">
                    <span>{n.label}</span>
                    {count > 0 && (
                      <span className="ml-2 rounded-full bg-gold px-1.5 py-0.2 text-[10px] font-extrabold text-navy-950">
                        {count}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Bottom Area: 3D Gradient Twisted Ribbon + Avatar + Logout */}
      <div className="pb-4 pt-2 flex flex-col items-center gap-3">
        {/* Floating 3D Twisted Ribbon / Torus Spiral (As seen in the reference screenshot!) */}
        <div className="relative group cursor-pointer" title="Dream Cyber AI Engine">
          <div className="relative w-12 h-12 flex items-center justify-center animate-float">
            <svg viewBox="0 0 100 100" className="w-11 h-11 drop-shadow-[0_8px_16px_rgba(251,174,68,0.35)]">
              <defs>
                <linearGradient id="ribbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FCCD7B" />
                  <stop offset="40%" stopColor="#FBAE44" />
                  <stop offset="80%" stopColor="#FF5E7E" />
                  <stop offset="100%" stopColor="#9C27B0" />
                </linearGradient>
                <linearGradient id="ribbonGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF5E7E" />
                  <stop offset="50%" stopColor="#8A2BE2" />
                  <stop offset="100%" stopColor="#4A148C" />
                </linearGradient>
                <filter id="glow3d" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#FBAE44" floodOpacity="0.4" />
                </filter>
              </defs>
              {/* Back twisted loop */}
              <path
                d="M32,58 C22,68 28,82 45,82 C65,82 78,64 74,48 C70,32 50,32 38,44"
                fill="none"
                stroke="url(#ribbonGrad2)"
                strokeWidth="15"
                strokeLinecap="round"
              />
              {/* Front glowing twisted loop */}
              <path
                d="M26,38 C20,24 38,15 54,18 C72,22 80,40 68,56 C56,72 32,68 24,54"
                fill="none"
                stroke="url(#ribbonGrad1)"
                strokeWidth="15"
                strokeLinecap="round"
                filter="url(#glow3d)"
              />
              {/* Core highlight dot */}
              <circle cx="50" cy="20" r="3.5" fill="#FFF" opacity="0.8" />
            </svg>
          </div>
        </div>

        {/* User Profile Avatar with Red Unread Badge */}
        <div className="relative group cursor-pointer" title={`${name} (${role})`}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2D2969] to-[#1D194B] border-2 border-white/20 text-xs font-black text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
            {name.charAt(0).toUpperCase()}
          </div>
          {/* Red unread badge (6 in reference) */}
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 border-2 border-[#121028] text-[9px] font-black text-white shadow-md">
            {badges.inbox > 0 ? badges.inbox : 6}
          </span>
        </div>

        {/* Bottom Actions Row: Logout & Options */}
        <div className="flex items-center gap-1.5 pt-1">
          <form action="/logout" method="post">
            <button
              type="submit"
              title="Sign out"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>

          <Link
            href="/settings"
            title="Preferences"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-gold hover:bg-white/10 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </Link>
        </div>
      </div>
    </aside>
  );
}
