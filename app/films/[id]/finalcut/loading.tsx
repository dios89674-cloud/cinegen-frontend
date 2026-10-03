export default function Loading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="h-14 rounded-2xl mb-6" style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="grid gap-6" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="h-[420px] rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="space-y-4">
          <div className="h-32 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="h-20 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="h-20 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>
    </div>
  );
}
