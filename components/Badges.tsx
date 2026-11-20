import { label } from "@/lib/constants";

export function ScoreBadge({ score }: { score: number }) {
  const c = score >= 50
    ? "bg-red-50 text-red-700 border border-red-200/80 font-bold"
    : score >= 25
    ? "bg-amber-50 text-amber-800 border border-amber-200 font-semibold"
    : "bg-slate-100 text-slate-600 border border-slate-200";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs ${c}`}>{score}</span>;
}

export function StageBadge({ stage }: { stage?: string | null }) {
  const c = stage === "won" || stage === "enrolled"
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
    : stage === "lost"
    ? "bg-slate-100 text-slate-500 border border-slate-200"
    : "bg-navy-50 text-navy border border-navy-border/25 font-medium";
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs ${c}`}>{label(stage)}</span>;
}

export function TempBadge({ t }: { t?: string | null }) {
  if (!t) return null;
  const c = t === "Hot"
    ? "text-red-600 font-bold"
    : t === "Warm"
    ? "text-amber-600 font-semibold"
    : "text-sky-600 font-medium";
  return <span className={`text-xs ${c}`}>{t}</span>;
}

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200/60 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
