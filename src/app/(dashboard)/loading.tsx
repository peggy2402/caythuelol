export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-xl bg-zinc-800/80" />
          <div className="h-4 w-80 max-w-full rounded-lg bg-zinc-800/50" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-zinc-800/70" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-zinc-900/70 border border-white/5 p-5 space-y-3"
          >
            <div className="h-4 w-24 rounded bg-zinc-800/80" />
            <div className="h-7 w-32 rounded bg-zinc-800" />
          </div>
        ))}
      </div>

      <div className="h-72 rounded-2xl bg-zinc-900/60 border border-white/5" />
    </div>
  );
}
