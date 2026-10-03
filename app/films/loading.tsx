export default function Loading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="h-14 rounded-2xl mb-6" style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="h-12 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.04)" }} />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl mb-2" style={{ background: "rgba(255,255,255,0.04)" }} />
      ))}
    </div>
  );
}
