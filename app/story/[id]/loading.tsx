// app/story/[id]/loading.tsx
export default function StoryLoading() {
  return (
    <div className="min-h-screen bg-ink-950 pt-16 animate-pulse">
      {/* Hero skeleton */}
      <div className="relative h-[55vh] min-h-80 bg-ink-900">
        <div className="absolute bottom-0 left-0 right-0 pb-10 px-6">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="h-4 w-24 bg-ink-800 rounded-sm" />
            <div className="h-12 w-3/4 bg-ink-800 rounded-sm" />
            <div className="h-6 w-1/2 bg-ink-800 rounded-sm" />
            <div className="h-4 w-40 bg-ink-800 rounded-sm" />
          </div>
        </div>
      </div>
      {/* Body skeleton */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-4 bg-ink-900 rounded-sm" style={{ width: `${75 + Math.random() * 25}%` }} />
        ))}
      </div>
    </div>
  )
}
