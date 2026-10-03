"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Play, Loader2, AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Film } from "@/lib/api";

const ACTIVE = new Set(["pending","queued","generating","rendering","assembling","approved","in_progress","awaiting_references"]);
const DONE   = new Set(["done","ready"]);

// ─── Visual gradient per card position ───────────────────────────────────────
const GRADIENTS = [
  "linear-gradient(135deg,#0f3460,#1a1a6e)",
  "linear-gradient(135deg,#1a0a2e,#2d1b4e)",
  "linear-gradient(135deg,#0a2a1a,#0d4438)",
  "linear-gradient(135deg,#2a0a0a,#4c1020)",
  "linear-gradient(135deg,#1a1a0a,#3a2a00)",
  "linear-gradient(135deg,#001a2a,#0a3050)",
];

function getGradient(idx: number) { return GRADIENTS[idx % GRADIENTS.length]; }

function fmtRelative(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Hace un momento";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h}h`;
  return new Date(dateStr).toLocaleDateString("es-ES", { day:"numeric", month:"short" });
}

function progressPct(film: Film): number {
  if (DONE.has(film.status)) return 100;
  if (film.status === "failed" || film.status === "cancelled") return 0;
  const map: Record<string,number> = { reference_analysis:8,script:18,casting:28,vfx:38,storyboard:50,camera:62,sound:72,editing:82,continuity:92 };
  const done = (film.completed_stages ?? film.stages_done ?? []).length;
  if (done > 0) return Math.min(92, Math.round((done / 9) * 100));
  return film.current_stage ? (map[film.current_stage] ?? 10) : 8;
}

// ─── Film card ────────────────────────────────────────────────────────────────
function FilmCard({ film, idx }: { film: Film; idx: number }) {
  const filmId = film.id ?? film.film_id ?? "";
  const isDone  = DONE.has(film.status);
  const isFail  = film.status === "failed" || film.status === "cancelled";
  const isActive = ACTIVE.has(film.status);
  const pct = progressPct(film);
  const title = film.title || film.premise_text?.slice(0, 60) || "Sin título";
  const href = filmId ? (isDone ? `/films/${filmId}` : `/films/${filmId}`) : "#";

  return (
    <Link href={href} className="group block" style={{ textDecoration: "none" }}>
      <div
        className="rounded-2xl overflow-hidden transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-2xl"
        style={{ background: "#0a1827", border: "1px solid #1b3b59" }}
      >
        {/* Thumbnail area */}
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: "16/9", background: getGradient(idx) }}
        >
          {film.thumbnail_url ? (
            <img src={film.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : null}

          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isDone ? (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
              >
                <Play size={20} className="text-white ml-1" fill="white" />
              </div>
            ) : isActive ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={24} className="text-white/60 animate-spin" />
                <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: "linear-gradient(90deg,#2788ff,#45d6f5)", transition: "width 1s ease" }}
                  />
                </div>
              </div>
            ) : isFail ? (
              <AlertCircle size={24} className="text-[#ff6578]/70" />
            ) : null}
          </div>

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            {isDone && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(41,197,139,0.15)", color: "#29c58b", border: "1px solid rgba(41,197,139,0.3)" }}>
                ✓ Listo
              </span>
            )}
            {isActive && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(39,136,255,0.15)", color: "#84c6ff", border: "1px solid rgba(39,136,255,0.2)" }}>
                ● Creando {pct}%
              </span>
            )}
            {film.status === "blocked_for_review" && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(246,185,75,0.15)", color: "#f6b94b", border: "1px solid rgba(246,185,75,0.2)" }}>
                ⏸ Revisión
              </span>
            )}
            {isFail && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(255,101,120,0.15)", color: "#ff9eaa", border: "1px solid rgba(255,101,120,0.2)" }}>
                Error
              </span>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="p-3">
          <p className="text-[#d5e5f4] text-sm font-medium leading-snug line-clamp-2 mb-1">{title}</p>
          <p className="text-[#4a6580] text-xs">{fmtRelative(film.created_at)}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center" style={{ background: "#0d2237" }}>
        <Play size={24} className="text-[#2788ff] ml-1" />
      </div>
      <h3 className="text-white text-lg font-semibold mb-2">
        {filtered ? "No hay resultados" : "Aún no tienes videos"}
      </h3>
      <p className="text-[#4a6580] text-sm mb-6 max-w-xs">
        {filtered ? "Prueba con otro filtro o búsqueda." : "Escribe tu primera idea y el sistema generará un video automáticamente."}
      </p>
      {!filtered && (
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-3 rounded-[12px] text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#2788ff,#1763d5)" }}
        >
          <Plus size={15} />
          Crear mi primer video
        </Link>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function FilmsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [films, setFilms]     = useState<Film[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<"all"|"active"|"done"|"failed">("all");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  const loadFilms = useCallback(async (p = 0) => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await api.listFilms(token, PAGE_SIZE, p * PAGE_SIZE);
      setFilms(r.films ?? []);
      setTotal(r.total ?? 0);
      setPage(p);
    } catch {
      setFilms([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadFilms(); }, [loadFilms]);

  const filtered = films.filter(f => {
    const text = (f.title || f.premise_text || "").toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchFilter = filter === "all"
      || (filter === "active" && (ACTIVE.has(f.status) || f.status === "blocked_for_review"))
      || (filter === "done"   && DONE.has(f.status))
      || (filter === "failed" && (f.status === "failed" || f.status === "cancelled"));
    return matchSearch && matchFilter;
  });

  if (authLoading || (!user && !authLoading)) return null;

  const filterPills: { key: typeof filter; label: string }[] = [
    { key: "all",    label: "Todos" },
    { key: "active", label: "Creando" },
    { key: "done",   label: "Listos" },
    { key: "failed", label: "Error" },
  ];

  return (
    <div className="p-6 pb-16 min-h-screen" style={{ background: "#060f19" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-[28px] font-bold text-white" style={{ letterSpacing: "-0.6px" }}>
          Mis videos
        </h1>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-semibold text-white transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#2788ff,#1763d5)" }}
        >
          <Plus size={15} />
          Crear video
        </Link>
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {/* Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-[10px]" style={{ background: "#0a1827", border: "1px solid #1b3b59" }}>
          {filterPills.map(p => (
            <button
              key={p.key}
              onClick={() => setFilter(p.key)}
              className="px-3 py-1.5 rounded-[7px] text-xs font-medium transition-all"
              style={filter === p.key
                ? { background: "#2788ff", color: "#fff" }
                : { color: "#91a8c0" }
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6580]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-8 pr-3 py-2 rounded-[9px] text-sm text-[#e8f2ff] placeholder-[#4a6580] outline-none"
            style={{ background: "#0a1827", border: "1px solid #1b3b59" }}
          />
        </div>

        {total > 0 && (
          <span className="text-[#4a6580] text-xs ml-auto">{total} video{total !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        /* Skeleton grid */
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "#0a1827", border: "1px solid #1b3b59" }}>
              <div style={{ aspectRatio: "16/9", background: "#0d2237" }} />
              <div className="p-3">
                <div className="h-4 rounded-full bg-[#0d2237] mb-2 w-3/4" />
                <div className="h-3 rounded-full bg-[#0d2237] w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filtered={!!search || filter !== "all"} />
      ) : (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {filtered.map((film, i) => (
              <FilmCard key={film.id ?? film.film_id ?? i} film={film} idx={i} />
            ))}
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => loadFilms(page - 1)}
                disabled={page === 0}
                className="px-4 py-2 rounded-[9px] text-sm text-[#91a8c0] disabled:opacity-30 transition-colors hover:text-white"
                style={{ background: "#0a1827", border: "1px solid #1b3b59" }}
              >
                ← Anterior
              </button>
              <span className="text-[#4a6580] text-xs">
                {page + 1} / {Math.ceil(total / PAGE_SIZE)}
              </span>
              <button
                onClick={() => loadFilms(page + 1)}
                disabled={(page + 1) * PAGE_SIZE >= total}
                className="px-4 py-2 rounded-[9px] text-sm text-[#91a8c0] disabled:opacity-30 transition-colors hover:text-white"
                style={{ background: "#0a1827", border: "1px solid #1b3b59" }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
