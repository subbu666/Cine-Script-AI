export function Loader({ label = "Crafting your blockbuster" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 text-sm text-gold">
      <span className="relative inline-flex h-4 w-4">
        <span className="absolute inset-0 animate-ping rounded-full bg-gold/40" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-gold-gradient" />
      </span>
      <span className="tracking-wide">{label}…</span>
    </div>
  );
}

export function SkeletonScript() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-10 w-2/3 rounded-md bg-white/5 shimmer" />
        <div className="h-4 w-1/3 rounded bg-white/5 shimmer" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-white/5 shimmer" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-white/5 shimmer" />
        ))}
      </div>
    </div>
  );
}
