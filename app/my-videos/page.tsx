"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Play, Loader2, CheckCircle2, AlertCircle, Clock, Plus, Film,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Film as FilmType, type FilmStatus } from "@/lib/api";
import { cn } from "@/lib/cn";

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:                      { label: "Pendiente",     cls: "bg-[#17324a] text-[#c8def3]" },
  queued:                       { label: "En cola",       cls: "bg-[#493819] text-[#ffd27c]" },
  generating:                   { label: "Generando",     cls: "bg-[#103d67] text-[#84c6ff]" },
  rendering:                    { label: "Renderizando",  cls: "bg-[#103d67] text-[#84c6ff]" },
  assembling:                   { label: "Ensamblando",   cls: "bg-[#103d67] text-[#84c6ff]" },
  approved:                     { label: "Aprobado",      cls: "bg-[#0d4438] text-[#6de3b4]" },
  ready:                        { label: "Listo",         cls: "bg-[#0d4438] text-[#6de3b4]" },
  done:                         { label: "Listo",         cls: "bg-[#0d4438] text-[#6de3b4]" },
  failed:                       { label: "Error",         cls: "bg-[#4c2030] text-[#ff9eaa]" },
  cancelled:                    { label: "Cancelado",     cls: "bg-[#17324a] text-[#4a6580]" },
  blocked_insufficient_credits: { label: "Sin créditos",  cls: "bg-[#493819] text-[#ffd27c]" },
};

const FILTERS = [
  { value: "all",        label: "Todos" },
  { value: "active",     label: "En producción" },
  { value: "done",       label: "Listos" },
  { value: "failed",     label: "Errores" },
];

function isActive(s: FilmStatus) {
  return ["pending","queued","generating","rendering","assembling","approved"].includes(s);
}
function isDone(s: FilmStatus) { return s === "done" || s === "ready"; }
function isFailed(s: FilmStatus) { return s === "failed" || s === "cancelled"; }

function FilmCard({ film }: { film: FilmType }) {
  const filmId = film.id ?? film.film_id ?? "";
  const done = isDone(film.status);
  const active = isActive(film.status);
  const cfg = STATUS_CFG[film.status] ?? STATUS_CFG.pending;
  const title = film.title || film.premise_text?.slice(0, 50) || "Sin título";
  const href = done ? `/films/${filmId}/finalcut` : `/films/${filmId}`;
  const pct = done ? 100 : active ? 45 : 0;

  return (
    <Link href={href}>
      <div
        className="group rounded-[14px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[3px]"
        style={{
          background: "linear-gradient(145deg, #0c2034, #091827)",
          border: "1px solid #1b3b59",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "#3173a8")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "#1b3b59")}
      >
        {/* Poster */}
        <div
          className="relative overflow-hidden"
          style={{ height: 142, background: "#122d43" }}
        >
          {film.thumbnail_url ? (
            <img
              src={film.thumbnail_url}
              alt=""
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {active ? (
                <Loader2 size={18} className="text-[#2788ff] animate-spin" />
              ) : (
                <Film size={20} className="text-[#1b3b59]" />
              )}
            </div>
          )}

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(transparent 25%, rgba(7,19,33,0.85))" }}
          />

          {/* Status pill */}
          <span className={cn("absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold", cfg.cls)}>
            {active ? <Loader2 size={9} className="animate-spin" /> : done ? <CheckCircle2 size={9} /> : isFailed(film.status) ? <AlertCircle size={9} /> : <Clock size={9} />}
            {cfg.label}
          </span>

          {/* Play overlay on hover for done */}
          {done && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                <Play size={14} fill="white" className="text-white ml-0.5" />
              </div>
            </div>
          )}

          {/* Progress bar for active */}
          {active && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "#172e44" }}>
              <div
                className="h-full"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #2788ff, #45d6f5)",
                  animation: "shimmer-progress 2s ease-in-out infinite",
                }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3.5">
          <p className="text-[#e8f2ff] text-sm font-medium leading-snug line-clamp-2 mb-1.5">{title}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#4a6580] text-xs">
              {film.created_at ? new Date(film.created_at).toLocaleDateString("es", { day: "numeric", month: "short" }) : ""}
            </span>
            {film.production_type && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: "#0d2237", color: "#91a8c0" }}>
                {film.production_type.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MyVideosPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [films, setFilms] = useState<FilmType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.listFilms(token);
      const arr = Array.isArray(data) ? data : [];
      setFilms(arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch { setFilms([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (token) load(); }, [token, load]);

  const filtered = films.filter(f => {
    const text = (f.title || f.premise_text || f.prompt || "").toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ? true :
      filter === "active" ? isActive(f.status) :
      filter === "done" ? isDone(f.status) :
      filter === "failed" ? isFailed(f.status) : true;
    return matchSearch && matchFilter;
  });

  if (authLoading || (!user && !authLoading)) return null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px 80px" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#e8f2ff] tracking-tight mb-1">Mis videos</h1>
          <p className="text-sm" style={{ color: "#91a8c0" }}>Historial de producciones</p>
        </div>
        <Link
          href="/dashboard"
          className="btn-glow flex items-center gap-1.5 px-4 py-2 rounded-[9px] text-sm font-medium text-white"
        >
          <Plus size={14} /> Crear nuevo
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-7">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6580]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="pl-8 pr-3 py-2 text-sm rounded-[9px] outline-none"
            style={{ background: "#0a1a2b", border: "1px solid #1b3b59", color: "#e8f2ff", width: 180 }}
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                border: `1px solid ${filter === f.value ? "#2788ff" : "#1b3b59"}`,
                background: filter === f.value ? "#103d67" : "#0a1a2b",
                color: filter === f.value ? "#fff" : "#91a8c0",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-[#4a6580] gap-2">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="empty-state-icon">
            <Film size={26} />
          </div>
          <p className="text-[#e8f2ff] font-medium mb-1">
            {search || filter !== "all" ? "Sin resultados" : "Aún no has creado ningún video"}
          </p>
          <p className="text-sm mb-6" style={{ color: "#91a8c0" }}>
            {search || filter !== "all" ? "Prueba con otro filtro." : "Escribe una idea y CineGen lo produce."}
          </p>
          {!search && filter === "all" && (
            <Link href="/dashboard" className="btn-glow inline-flex items-center gap-2 px-5 py-2.5 rounded-[9px] text-sm font-medium text-white">
              <Plus size={14} /> Crear ahora
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {filtered.map(film => (
              <FilmCard key={film.id ?? film.film_id} film={film} />
            ))}
          </div>
          <p className="text-xs text-center mt-6" style={{ color: "#4a6580" }}>
            {filtered.length} produccion{filtered.length !== 1 ? "es" : ""}
          </p>
        </>
      )}
    </div>
  );
}
