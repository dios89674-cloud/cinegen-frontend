export default function Loading() {
  return (
    <div className="p-8 animate-pulse">
      {/* topbar skeleton */}
      <div className="h-14 rounded-2xl mb-8" style={{ background: "rgba(255,255,255,0.04)" }} />
      {/* stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
      {/* cards grid */}
      <div className="grid grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-40 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
    </div>
  );
}
