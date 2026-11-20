export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-xl bg-slate-200" />
          <div className="h-4 w-72 rounded-lg bg-slate-100" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-slate-200" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-white p-5 shadow-xs border border-slate-200/60">
            <div className="h-3 w-20 rounded bg-slate-200 mb-4" />
            <div className="h-8 w-16 rounded bg-slate-300" />
          </div>
        ))}
      </div>

      {/* Main Content Area skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-96 rounded-2xl bg-white p-6 shadow-xs border border-slate-200/60 lg:col-span-8">
          <div className="h-4 w-40 rounded bg-slate-200 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-14 rounded-xl bg-slate-50 border border-slate-100" />
            ))}
          </div>
        </div>
        <div className="h-96 rounded-2xl bg-white p-6 shadow-xs border border-slate-200/60 lg:col-span-4">
          <div className="h-4 w-32 rounded bg-slate-200 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-20 rounded-xl bg-slate-50 border border-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
