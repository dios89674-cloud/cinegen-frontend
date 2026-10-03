"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Download, Plus, AlertCircle, RotateCcw, CheckCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Film } from "@/lib/api";

// ─── Rotating messages shown while generating ─────────────────────────────────
const MESSAGES = [
  "Leyendo tu idea...",
  "Escribiendo la historia...",
  "Diseñando los personajes...",
  "Componiendo las escenas...",
  "Generando los planos de cámara...",
  "Renderizando los clips...",
  "Montando tu video...",
  "Afinando los últimos detalles...",
];

const ACTIVE = new Set(["pending","queued","generating","rendering","assembling","approved","in_progress","awaiting_references"]);
const DONE   = new Set(["done","ready"]);

function progress(film: Film): number {
  if (DONE.has(film.status)) return 100;
  if (film.status === "failed" || film.status === "cancelled") return 0;
  const stages = ["reference_analysis","script","casting","vfx","storyboard","camera","sound","editing","continuity"];
  const done = (film.completed_stages ?? film.stages_done ?? []).length;
  if (done > 0) return Math.min(92, Math.round((done / stages.length) * 100));
  const map: Record<string,number> = { reference_analysis:8,script:18,casting:28,vfx:38,storyboard:50,camera:62,sound:72,editing:82,continuity:92 };
  return film.current_stage ? (map[film.current_stage] ?? 10) : 8;
}

function fmtDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", { day:"numeric", month:"short", year:"numeric" });
}

// ─── Generating screen ────────────────────────────────────────────────────────
function GeneratingView({ film, onCancel, cancelling }: { film: Film; onCancel: () => void; cancelling: boolean }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const pct = progress(film);
  const isBlocked = film.status === "blocked_for_review";

  useEffect(() => {
    if (isBlocked) return;
    const t = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 2800);
    return () => clearInterval(t);
  }, [isBlocked]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-6 text-center">
      {/* Animated ring */}
      <div className="relative w-28 h-28 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r="48" fill="none" stroke="#0d2237" strokeWidth="6" />
          <circle
            cx="56" cy="56" r="48" fill="none"
            stroke="url(#g)" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${301.6 * pct / 100} 301.6`}
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2788ff" />
              <stop offset="100%" stopColor="#45d6f5" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{pct}<span className="text-sm text-[#4a6580]">%</span></span>
        </div>
      </div>

      <h2 className="text-[28px] font-bold text-white mb-2" style={{ letterSpacing: "-0.5px" }}>
        {isBlocked ? "Revisión requerida" : "Creando tu video"}
      </h2>

      <p className="text-[#91a8c0] text-base mb-8 max-w-md line-clamp-2">
        {film.title || film.premise_text?.slice(0, 80) || "Procesando..."}
      </p>

      {isBlocked ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-[#f6b94b] text-sm max-w-xs">
            El pipeline necesita tu aprobación para continuar la producción.
          </p>
          {/* Approve button handled in parent */}
        </div>
      ) : (
        <>
          {/* Rotating message */}
          <div className="h-6 mb-6">
            <p className="text-[#45d6f5] text-sm font-medium animate-pulse">{MESSAGES[msgIdx]}</p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "#0d2237" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg,#2788ff,#45d6f5)", transition: "width 1.2s ease" }}
            />
          </div>
          <p className="text-[#4a6580] text-xs mb-10">Promedio: 2–5 minutos. Puedes cerrar esta pestaña.</p>

          <button
            onClick={onCancel}
            disabled={cancelling}
            className="text-[#4a6580] text-sm hover:text-[#e8f2ff] transition-colors"
          >
            {cancelling ? "Cancelando..." : "Cancelar generación"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Video ready screen ───────────────────────────────────────────────────────
function ReadyView({ film, filmId, onDownload, downloading }: { film: Film; filmId: string; onDownload: () => void; downloading: boolean }) {
  const router = useRouter();
  const title = film.title || film.premise_text?.slice(0, 80) || "Tu video";

  return (
    <div className="max-w-4xl mx-auto px-6 pb-16 pt-4">
      {/* Video player */}
      <div
        className="w-full rounded-2xl overflow-hidden mb-6"
        style={{ background: "#04111d", boxShadow: "0 0 60px rgba(39,136,255,0.12)" }}
      >
        {film.video_url ? (
          <video
            src={film.video_url}
            controls
            playsInline
            preload="metadata"
            className="w-full"
            style={{ maxHeight: "62vh", background: "#000" }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-[#4a6580]">
            <CheckCircle size={40} className="text-[#29c58b] mb-4" />
            <p className="font-medium text-[#e8f2ff]">Video listo</p>
            <p className="text-sm mt-1">Descárgalo para verlo</p>
          </div>
        )}
      </div>

      {/* Title + meta */}
      <h1 className="text-[22px] font-bold text-white mb-1" style={{ letterSpacing: "-0.4px" }}>{title}</h1>
      <p className="text-[#4a6580] text-sm mb-6">{fmtDate(film.created_at)}</p>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-3 rounded-[12px] text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#2788ff,#1763d5)" }}
        >
          <Download size={15} />
          {downloading ? "Preparando..." : "Descargar video"}
        </button>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-5 py-3 rounded-[12px] text-sm font-semibold transition-all"
          style={{ background: "#0d1f30", color: "#91a8c0", border: "1px solid #1b3b59" }}
        >
          <Plus size={15} />
          Crear otro video
        </button>
      </div>
    </div>
  );
}

// ─── Error screen ─────────────────────────────────────────────────────────────
function ErrorView({ film, onRetry }: { film: Film; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-6">
      <AlertCircle size={48} className="text-[#ff6578] mb-6" />
      <h2 className="text-2xl font-bold text-white mb-2">Algo salió mal</h2>
      <p className="text-[#91a8c0] text-sm max-w-xs mb-8">
        {film.error || "Ocurrió un error durante la generación. Intenta crear un nuevo video."}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-3 rounded-[12px] text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg,#2788ff,#1763d5)" }}
      >
        <RotateCcw size={15} />
        Intentar de nuevo
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function FilmPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [film, setFilm] = useState<Film | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [approving, setApproving] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filmId = Array.isArray(id) ? id[0] : id;

  const fetchFilm = useCallback(async () => {
    if (!token || !filmId) return;
    try {
      // Fire-and-forget poll to advance pipeline; don't block the fetch
      api.pollFilm(token, filmId).catch(() => {});
      const data = await api.getFilm(token, filmId);
      setFilm(data);
      setLoading(false);
      if (DONE.has(data.status) || data.status === "failed" || data.status === "cancelled") {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    } catch {
      setLoading(false);
    }
  }, [token, filmId]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!token) return;
    fetchFilm();
    pollRef.current = setInterval(fetchFilm, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token, filmId]);

  const handleCancel = async () => {
    if (!token || !filmId || cancelling) return;
    setCancelling(true);
    try { await api.cancelFilm(token, filmId); await fetchFilm(); } catch {} finally { setCancelling(false); }
  };

  const handleApprove = async () => {
    if (!token || !filmId || approving) return;
    setApproving(true);
    try { await api.approveContinuity(token, filmId); await fetchFilm(); } catch {} finally { setApproving(false); }
  };

  const handleDownload = async () => {
    if (!token || !filmId || downloading) return;
    setDownloading(true);
    try {
      if (film?.video_url) { window.open(film.video_url, "_blank"); return; }
      const { download_url } = await api.downloadFilm(token, filmId);
      window.open(download_url, "_blank");
    } catch {} finally { setDownloading(false); }
  };

  const handleRetry = () => router.push("/");

  // Loading skeleton
  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <div className="w-32 h-4 rounded-full bg-[#0d2237] animate-pulse mb-8" />
        <div className="w-full aspect-video rounded-2xl bg-[#0d2237] animate-pulse mb-6" />
        <div className="w-64 h-6 rounded-full bg-[#0d2237] animate-pulse mb-3" />
        <div className="w-40 h-4 rounded-full bg-[#0d2237] animate-pulse" />
      </div>
    );
  }

  if (!film) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <AlertCircle size={32} className="text-[#ff6578] mb-4" />
      <p className="text-[#91a8c0]">Video no encontrado</p>
      <Link href="/films" className="text-[#2788ff] text-sm mt-2 hover:underline">← Mis videos</Link>
    </div>
  );

  const isDone  = DONE.has(film.status);
  const isFail  = film.status === "failed" || film.status === "cancelled";
  const isBlock = film.status === "blocked_for_review";

  return (
    <div className="min-h-screen pt-6" style={{ background: "#060f19" }}>
      {/* Nav bar */}
      <div className="flex items-center justify-between px-6 mb-6">
        <Link
          href="/films"
          className="flex items-center gap-2 text-[#91a8c0] hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={15} />
          Mis videos
        </Link>

        {isBlock && (
          <button
            onClick={handleApprove}
            disabled={approving}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#f6b94b,#e09a20)" }}
          >
            <CheckCircle size={14} />
            {approving ? "Aprobando..." : "Aprobar y continuar"}
          </button>
        )}

        {isDone && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium text-[#91a8c0] hover:text-white transition-colors"
            style={{ background: "#0d1f30", border: "1px solid #1b3b59" }}
          >
            <Download size={14} />
            {downloading ? "Preparando..." : "Descargar"}
          </button>
        )}
      </div>

      {/* Main content */}
      {isFail
        ? <ErrorView film={film} onRetry={handleRetry} />
        : isDone
          ? <ReadyView film={film} filmId={filmId} onDownload={handleDownload} downloading={downloading} />
          : <GeneratingView film={film} onCancel={handleCancel} cancelling={cancelling} />
      }
    </div>
  );
}
