"use client";


import { useState, useEffect, useCallback } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Film as FilmType, type Shot } from "@/lib/api";
import { cn } from "@/lib/cn";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function shotTimeLabel(shot: Shot): string {
  const start = shot.index * 5;
  const end = (shot.index + 1) * 5;
  return `${fmtTime(start)}–${fmtTime(end)}`;
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

function Tag({ status }: { status: string }) {
  const cls =
    status === "done" || status === "ready" ? "bg-[#0d4438] text-[#6de3b4]" :
    status === "failed" ? "bg-[#4c2030] text-[#ff9eaa]" :
    status === "generating" || status === "rendering" ? "bg-[#103d67] text-[#84c6ff]" :
    "bg-[#17324a] text-[#c8def3]";
  const label =
    status === "done" || status === "ready" ? "Validado" :
    status === "failed" ? "Error" :
    status === "generating" || status === "rendering" ? "Generando" :
    "Pendiente";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold", cls)}>
      {label}
    </span>
  );
}

const FILM_STATUS_TAG: Record<string, { label: string; cls: string }> = {
  done:  { label: "Storyboard listo", cls: "bg-[#0d4438] text-[#6de3b4]" },
  ready: { label: "Storyboard listo", cls: "bg-[#0d4438] text-[#6de3b4]" },
  generating: { label: "● Generando planos", cls: "bg-[#103d67] text-[#84c6ff]" },
  default: { label: "En producción", cls: "bg-[#17324a] text-[#c8def3]" },
};

// ─── Shot names ───────────────────────────────────────────────────────────────

const SHOT_NAMES = [
  "Establecimiento", "Llegada", "Descubrimiento", "Confrontación", "Salida",
  "Reacción", "Resolución", "Clímax", "Epílogo", "Apertura",
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StoryboardPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [film, setFilm] = useState<FilmType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [toast, setToast] = useState("");

  const filmId = Array.isArray(id) ? id[0] : id;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchFilm = useCallback(async () => {
    if (!token || !filmId) return;
    try {
      const data = await api.getFilm(token, filmId);
      setFilm(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [token, filmId]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (token) fetchFilm();
  }, [token, fetchFilm]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#2788ff]/30 border-t-[#2788ff] rounded-full animate-spin" />
      </div>
    );
  }

  if (!film) {
    return (
      <div className="p-8">
        <div className="rounded-[14px] p-8 text-center" style={{ background: "linear-gradient(145deg,#0c2034,#091827)", border: "1px solid #1b3b59" }}>
          <AlertCircle size={32} className="text-[#ff6578] mx-auto mb-4" />
          <p className="text-[#e8f2ff] font-semibold mb-2">Proyecto no encontrado</p>
          <button onClick={() => router.push("/dashboard")} className="text-[#2788ff] text-sm hover:underline">← Volver</button>
        </div>
      </div>
    );
  }

  const shots = film.shots ?? [];
  const selectedShot = shots[selectedIdx] ?? null;
  const filmStatusTag = FILM_STATUS_TAG[film.status] ?? FILM_STATUS_TAG.default;
  const displayTitle = film.title || film.premise_text?.slice(0, 60) || "Sin título";
  const hasWarning = selectedShot && (selectedShot.status === "failed" || (!selectedShot.thumbnail_url && !selectedShot.video_url));

  const card = "rounded-[14px] p-[18px]";
  const cardStyle = { background: "linear-gradient(145deg,#0c2034,#091827)", border: "1px solid #1b3b59" };

  return (
    <div className="p-6 md:p-8 pb-16 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-[10px] px-4 py-3 text-sm font-medium shadow-xl"
          style={{ background: "#103a30", border: "1px solid #23765f", color: "#b4f5dc" }}>
          {toast}
        </div>
      )}

      {/* Topbar */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <p className="text-[#45d6f5] text-[11px] uppercase tracking-[1.8px] font-bold mb-1">Dirección y continuidad</p>
          <h1 className="text-[clamp(22px,3vw,32px)] font-bold tracking-tight text-[#e8f2ff]" style={{ letterSpacing: "-1px" }}>
            Storyboard & Shot Room
          </h1>
          <p className="text-[#91a8c0] text-sm mt-1">Revisa cada plano y comprueba la coherencia visual de la secuencia.</p>
        </div>
        <Link href={`/films/${filmId}`} className="flex items-center gap-1.5 text-[#91a8c0] hover:text-[#e8f2ff] text-sm transition-colors shrink-0 mt-1">
          <ArrowLeft size={14} /> Monitor
        </Link>
      </div>

      {/* Film summary header card */}
      <div className={cn(card, "mb-4 flex items-center gap-4")} style={cardStyle}>
        <div className="w-28 h-[80px] rounded-[10px] overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "#122d43" }}>
          {film.thumbnail_url ? (
            <img src={film.thumbnail_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-5 h-5 border-2 border-[#2788ff]/30 border-t-[#2788ff] rounded-full animate-spin" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold", filmStatusTag.cls)}>
            {filmStatusTag.label}
          </span>
          <h3 className="text-[#e8f2ff] font-semibold text-[15px] mt-1.5 mb-0.5 truncate">{displayTitle}</h3>
          <p className="text-[#91a8c0] text-[11px]">
            {shots.length > 0 ? `${shots.length} planos` : "Sin planos"} · {film.genre || film.production_type || "General"} · Revisión de continuidad
          </p>
        </div>
        <button
          onClick={() => { fetchFilm(); showToast("Continuidad actualizada."); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-xs border border-[#1b3b59] text-[#e8f2ff] transition-all hover:brightness-110 shrink-0"
          style={{ background: "#0c2034" }}
        >
          <RefreshCw size={11} /> Revisar continuidad
        </button>
      </div>

      {/* Shot layout */}
      {shots.length === 0 ? (
        <div className={cn(card, "text-center py-12")} style={cardStyle}>
          <p className="text-[#91a8c0] text-sm mb-2">No hay planos disponibles aún.</p>
          <p className="text-[#4a6580] text-xs">Los planos aparecerán aquí cuando la producción avance.</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "1.4fr 0.8fr" }}>
          {/* Left: shot strip + large preview */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[#e8f2ff] font-semibold text-[15px]">Storyboard</h2>
                <p className="text-[#91a8c0] text-[12px]">Selecciona un plano para ver los detalles.</p>
              </div>
              <button
                onClick={() => showToast("La vista de lista se conectará al modelo real de planos.")}
                className="px-3 py-2 rounded-[9px] text-xs border border-[#1b3b59] text-[#e8f2ff] hover:brightness-110"
                style={{ background: "#0c2034" }}
              >
                Lista de planos
              </button>
            </div>

            {/* Shot strip (5-col grid) */}
            <div className="grid gap-2 mb-5" style={{ gridTemplateColumns: "repeat(5, minmax(0,1fr))" }}>
              {shots.slice(0, 10).map((shot, i) => (
                <button
                  key={shot.shot_id ?? i}
                  onClick={() => setSelectedIdx(i)}
                  className={cn(
                    "rounded-[9px] overflow-hidden cursor-pointer border transition-all",
                    selectedIdx === i
                      ? "border-[#2788ff] shadow-[0_0_0_2px_#2788ff22]"
                      : "border-[#1b3a56] hover:border-[#2788ff]/50"
                  )}
                  style={{ background: "#081827" }}
                >
                  <div className="relative h-[76px] overflow-hidden">
                    {shot.thumbnail_url || shot.video_url ? (
                      <img
                        src={shot.thumbnail_url ?? shot.video_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {shot.status === "generating" ? (
                          <Loader2 size={12} className="text-[#2788ff] animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full" style={{ background: "#1b3b59" }} />
                        )}
                      </div>
                    )}
                  </div>
                  <small className="block px-2 py-1.5 text-[10px] text-[#91a8c0] truncate">
                    {String(shot.index + 1).padStart(2, "0")} · {shotTimeLabel(shot)}
                  </small>
                </button>
              ))}
            </div>

            {/* Large preview */}
            {selectedShot && (
              <div>
                <div className="rounded-[10px] overflow-hidden w-full" style={{ height: 230, background: "#122d43" }}>
                  {selectedShot.thumbnail_url || selectedShot.video_url ? (
                    <img
                      src={selectedShot.thumbnail_url ?? selectedShot.video_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 size={24} className="text-[#2788ff]/30 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <h2 className="text-[#e8f2ff] font-semibold text-[14px]">
                      Plano {String(selectedShot.index + 1).padStart(2, "0")} — {SHOT_NAMES[selectedIdx % SHOT_NAMES.length]}
                    </h2>
                    <p className="text-[#91a8c0] text-[12px] mt-0.5">
                      {selectedShot.description || "Plano generado por IA · Sin descripción adicional"}
                    </p>
                  </div>
                  <Tag status={selectedShot.status ?? "pending"} />
                </div>
              </div>
            )}
          </div>

          {/* Right: continuity panel */}
          <div className={card} style={cardStyle}>
            <h2 className="text-[#e8f2ff] font-semibold text-[15px] mb-1">Continuidad del plano</h2>
            <p className="text-[#91a8c0] text-[12px] mb-4">Estado visual esperado para este plano.</p>

            {selectedShot ? (
              <>
                {/* Lock rows */}
                <div>
                  {[
                    { label: "Descripción", value: selectedShot.description || "—" },
                    { label: "Estado", value: selectedShot.status || "—" },
                    { label: "Índice", value: String(selectedShot.index + 1) },
                    { label: "Intervalo", value: shotTimeLabel(selectedShot) },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between gap-2 py-2.5 border-b border-[#173149] text-sm last:border-0">
                      <span className="text-[#91a8c0]">{row.label}</span>
                      <strong className="text-[#e8f2ff] text-right text-[12px] max-w-[140px] truncate">{row.value}</strong>
                    </div>
                  ))}
                </div>

                {/* Warning */}
                {hasWarning && (
                  <div className="mt-4 rounded-[10px] p-3 text-[12px]" style={{ background: "#3b2a17", border: "1px solid #765022", color: "#ffd89b" }}>
                    ⚠ Este plano requiere revisión o regeneración.
                  </div>
                )}

                {/* Actions */}
                <div className="grid gap-2 mt-4">
                  <button
                    onClick={() => showToast(`Plano ${selectedShot.index + 1} — ID: ${selectedShot.shot_id}`)}
                    className="w-full py-2.5 px-4 rounded-[9px] text-sm border border-[#1b3b59] text-[#e8f2ff] text-left hover:brightness-110 transition-all"
                    style={{ background: "#0c2034" }}
                  >
                    Ver detalles del plano
                  </button>
                  <button
                    onClick={() => showToast("La regeneración consume créditos. No disponible en esta vista.")}
                    className="w-full py-2.5 px-4 rounded-[9px] text-sm border border-[#1b3b59] text-[#e8f2ff] text-left hover:brightness-110 transition-all"
                    style={{ background: "#0c2034" }}
                  >
                    ↻ Regenerar plano
                  </button>
                  <button
                    onClick={() => showToast("✓ Continuidad aprobada para este plano.")}
                    className="w-full py-2.5 px-4 rounded-[9px] text-sm text-white font-medium text-left hover:brightness-110 transition-all"
                    style={{ background: "linear-gradient(135deg,#1680ff,#1763d5)", border: "1px solid #368fff" }}
                  >
                    <CheckCircle2 size={13} className="inline mr-1.5" />
                    Aprobar continuidad
                  </button>
                </div>
                <p className="text-[#4a6580] text-[10px] mt-3">La regeneración puede consumir créditos.</p>
              </>
            ) : (
              <p className="text-[#4a6580] text-sm">Selecciona un plano para ver su continuidad.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
