import { label } from "@/lib/constants";

export function ScoreBadge({ score }: { score: number }) {
  const c = score >= 50 ? "bg-red-100 text-red-700" : score >= 25 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c}`}>{score}</span>;
}

export function StageBadge({ stage }: { stage?: string | null }) {
  const c = stage === "won" || stage === "enrolled" ? "bg-emerald-100 text-emerald-700"
    : stage === "lost" ? "bg-slate-200 text-slate-500" : "bg-teal-50 text-teal-700";
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${c}`}>{label(stage)}</span>;
}

export function TempBadge({ t }: { t?: string | null }) {
  if (!t) return null;
  const c = t === "Hot" ? "text-red-600" : t === "Warm" ? "text-amber-600" : "text-sky-600";
  return <span className={`text-xs font-semibold ${c}`}>{t}</span>;
}

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold">{title}</h1>{sub && <p className="text-sm text-slate-500">{sub}</p>}</div>
      {children}
    </div>
  );
}
