export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 bg-muted/60 rounded-lg mb-2" />
          <div className="h-4 w-32 bg-muted/40 rounded-lg" />
        </div>
        <div className="hidden sm:block h-10 w-36 bg-muted/40 rounded-xl" />
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-4 md:p-5 h-28 bg-muted/20 border-border/40" />
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5 h-80 bg-muted/20 border-border/40" />
        <div className="glass-card rounded-2xl p-5 h-80 bg-muted/20 border-border/40" />
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5 h-64 bg-muted/20 border-border/40" />
        <div className="glass-card rounded-2xl p-5 h-64 bg-muted/20 border-border/40" />
      </div>
    </div>
  )
}
