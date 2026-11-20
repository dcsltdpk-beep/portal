"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface AutoRefreshProps {
  intervalMs?: number; // default 15000 (15s)
}

export default function AutoRefresh({ intervalMs = 15000 }: AutoRefreshProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isAuto, setIsAuto] = useState<boolean>(true);

  const refresh = () => {
    startTransition(() => {
      router.refresh();
      setLastRefreshed(new Date());
    });
  };

  useEffect(() => {
    if (!isAuto) return;

    // Periodic auto-refresh interval
    const timer = setInterval(() => {
      refresh();
    }, intervalMs);

    // Also auto-refresh immediately when user focuses back on the tab
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    const onFocus = () => {
      refresh();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuto, intervalMs]);

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/90 px-2.5 py-1 text-xs shadow-2xs backdrop-blur-xs">
      <button
        type="button"
        onClick={() => setIsAuto(!isAuto)}
        title={isAuto ? "Live auto-sync active (clicks to pause)" : "Live auto-sync paused (clicks to resume)"}
        className="flex items-center gap-1.5 font-medium text-slate-600 hover:text-navy transition"
      >
        <span className="relative flex h-2 w-2">
          {isAuto && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              isAuto ? "bg-emerald-500" : "bg-slate-300"
            }`}
          />
        </span>
        <span className="text-[11px] font-semibold hidden md:inline">
          {isAuto ? "Live (15s)" : "Paused"}
        </span>
      </button>

      <div className="h-3.5 w-px bg-slate-200" />

      {/* Manual refresh button */}
      <button
        type="button"
        onClick={refresh}
        disabled={isPending}
        title="Sync latest data right now"
        className="text-slate-400 hover:text-navy disabled:opacity-50 transition p-0.5 rounded-md hover:bg-slate-100"
      >
        <svg
          className={`h-3.5 w-3.5 ${isPending ? "animate-spin text-gold-dark" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
}
