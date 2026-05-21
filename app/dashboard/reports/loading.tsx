export default function GenericLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-48 bg-muted/60 rounded-lg mb-2" />
        <div className="h-4 w-64 bg-muted/40 rounded-lg" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-5 h-24 bg-muted/20 border-border/40" />
        ))}
      </div>
    </div>
  )
}
