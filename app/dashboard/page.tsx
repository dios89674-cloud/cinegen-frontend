"use client";


import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Film, CheckCircle2, AlertCircle, Loader2, Clock, Search,
  Coins, Video, Clapperboard, Smartphone, Megaphone, BookOpen,
  Play, Bell, ChevronRight, Zap, LayoutGrid
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Film as FilmType, type FilmStatus } from "@/lib/api";
import { cn } from "@/lib/cn";

// ─── Production type labels ───────────────────────────────────────────────────

const PROD_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  SHORT_FILM:        { label: "Cortometraje",  color: "text-[#2788ff] bg-[#2788ff]/10" },
  FEATURE_FILM:      { label: "Largometraje",  color: "text-[#2788ff] bg-[#2788ff]/10" },
  FEATURE_FILM_FULL: { label: "Film completo", color: "text-[#2788ff] bg-[#2788ff]/10" },
  TRAILER:           { label: "Tráiler",       color: "text-[#f6b94b] bg-[#f6b94b]/10" },
  TV_SERIES:         { label: "Serie TV",      color: "text-[#45d6f5] bg-[#45d6f5]/10" },
  MINISERIES:        { label: "Miniserie",     color: "text-[#45d6f5] bg-[#45d6f5]/10" },
  NOVELA:            { label: "Telenovela",    color: "text-[#45d6f5] bg-[#45d6f5]/10" },
  ANTHOLOGY:         { label: "Antología",     color: "text-[#45d6f5] bg-[#45d6f5]/10" },
  SOCIAL_SHORT:      { label: "Social/Reel",   color: "text-[#29c58b] bg-[#29c58b]/10" },
  MUSIC_VIDEO:       { label: "Videoclip",     color: "text-[#29c58b] bg-[#29c58b]/10" },
  YOUTUBE_LONG:      { label: "YouTube",       color: "text-[#29c58b] bg-[#29c58b]/10" },
  ADVERTISEMENT:     { label: "Anuncio",       color: "text-[#f6b94b] bg-[#f6b94b]/10" },
  BRAND_FILM:        { label: "Brand Film",    color: "text-[#f6b94b] bg-[#f6b94b]/10" },
  PRODUCT_VIDEO:     { label: "Producto",      color: "text-[#f6b94b] bg-[#f6b94b]/10" },
  CORPORATE_VIDEO:   { label: "Corporativo",   color: "text-[#f6b94b] bg-[#f6b94b]/10" },
  EXPLAINER:         { label: "Explainer",     color: "text-[#91a8c0] bg-[#91a8c0]/10" },
  PODCAST_VIDEO:     { label: "Podcast",       color: "text-[#91a8c0] bg-[#91a8c0]/10" },
  NEWS_REPORT:       { label: "Reportaje",     color: "text-[#91a8c0] bg-[#91a8c0]/10" },
  TRAINING_VIDEO:    { label: "Formación",     color: "text-[#91a8c0] bg-[#91a8c0]/10" },
  DOCUMENTARY:       { label: "Documental",    color: "text-[#f6b94b] bg-[#f6b94b]/10" },
  EVENT_HIGHLIGHT:   { label: "Evento",        color: "text-[#f6b94b] bg-[#f6b94b]/10" },
  SPORTS_HIGHLIGHT:  { label: "Deportes",      color: "text-[#f6b94b] bg-[#f6b94b]/10" },
  TESTIMONIAL:       { label: "Testimonial",   color: "text-[#91a8c0] bg-[#91a8c0]/10" },
};

const STATUS_CFG: Record<string, { label: string; icon: React.ReactNode; pill: string }> = {
  pending:    { label: "Pendiente",     icon: <Clock size={10} />,       pill: "bg-white/5 text-[#91a8c0]" },
  queued:     { label: "En cola",       icon: <Clock size={10} />,       pill: "bg-[#f6b94b]/10 text-[#f6b94b]" },
  generating: { label: "Generando",    icon: <Loader2 size={10} className="animate-spin" />, pill: "bg-[#2788ff]/10 text-[#2788ff]" },
  rendering:  { label: "Renderizando", icon: <Loader2 size={10} className="animate-spin" />, pill: "bg-[#2788ff]/10 text-[#2788ff]" },
  assembling: { label: "Ensamblando",  icon: <Loader2 size={10} className="animate-spin" />, pill: "bg-[#45d6f5]/10 text-[#45d6f5]" },
  approved:   { label: "Aprobado",     icon: <CheckCircle2 size={10} />, pill: "bg-[#29c58b]/10 text-[#29c58b]" },
  ready:      { label: "Listo",        icon: <CheckCircle2 size={10} />, pill: "bg-[#29c58b]/10 text-[#29c58b]" },
  done:       { label: "Listo",        icon: <CheckCircle2 size={10} />, pill: "bg-[#29c58b]/10 text-[#29c58b]" },
  failed:     { label: "Error",        icon: <AlertCircle size={10} />,  pill: "bg-[#ff6578]/10 text-[#ff6578]" },
  cancelled:  { label: "Cancelado",    icon: <AlertCircle size={10} />,  pill: "bg-white/5 text-[#4a6580]" },
  blocked_insufficient_credits: { label: "Sin créditos", icon: <AlertCircle size={10} />, pill: "bg-[#f6b94b]/10 text-[#f6b94b]" },
};

function isActive(s: FilmStatus) { return ["pending","queued","generating","rendering","assembling","approved"].includes(s); }
function isDone(s: FilmStatus)   { return s === "done" || s === "ready"; }

// ─── Create categories ────────────────────────────────────────────────────────

const CREATE_CATS = [
  { icon: Clapperboard, color: "#2788ff", bg: "rgba(39,136,255,0.08)", label: "Vídeo y narrativa",     desc: "Films, cortos, series, trailers",         cat: "cinematic" },
  { icon: Smartphone,   color: "#29c58b", bg: "rgba(41,197,139,0.08)", label: "Social y creadores",    desc: "Shorts, reels, YouTube",                  cat: "social" },
  { icon: Megaphone,    color: "#f6b94b", bg: "rgba(246,185,75,0.08)", label: "Marcas y negocios",     desc: "Anuncios, brand films, producto",          cat: "brands" },
  { icon: BookOpen,     color: "#45d6f5", bg: "rgba(69,214,245,0.08)", label: "Educativo y docs",      desc: "Documentales, formación, podcast",         cat: "educational" },
];

// ─── Film card ────────────────────────────────────────────────────────────────

function FilmCard({ film }: { film: FilmType }) {
  const cfg = STATUS_CFG[film.status] ?? STATUS_CFG.pending;
  const active = isActive(film.status);
  const done   = isDone(film.status);
  const filmId = film.id ?? film.film_id ?? "";
  const typeInfo = film.production_type ? PROD_TYPE_LABEL[film.production_type] : null;
  const href = `/films/${filmId}`;

  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="group rounded-[12px] overflow-hidden cursor-pointer transition-all duration-200 hover:translate-y-[-2px]"
        style={{ background: "#0a1a2b", border: "1px solid #1b3b59" }}
        whileHover={{ borderColor: "#3173a8" }}
      >
        {/* Poster */}
        <div className="relative aspect-video overflow-hidden" style={{ background: "#06111f" }}>
          {film.thumbnail_url ? (
            <img src={film.thumbnail_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {active
                ? <div className="w-5 h-5 border-2 border-[#2788ff]/30 border-t-[#2788ff] rounded-full animate-spin" />
                : <Film size={20} className="text-[#1b3b59]" />}
            </div>
          )}

          {active && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1b3b59]">
              <motion.div
                className="h-full"
                style={{ background: "linear-gradient(90deg, #2788ff, #45d6f5)" }}
                animate={{ width: ["20%","85%","20%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          )}

          {done && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/0 group-hover:bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Play size={12} className="text-white ml-0.5" fill="white" />
              </div>
            </div>
          )}

          <div className={cn("absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold backdrop-blur-sm", cfg.pill)}>
            {cfg.icon}
            {cfg.label}
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-[#e8f2ff] text-sm font-medium leading-snug line-clamp-1 mb-1.5">
            {film.title || film.premise_text || film.prompt || "Sin título"}
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#4a6580] text-xs">
              {film.created_at ? new Date(film.created_at).toLocaleDateString("es", { day: "numeric", month: "short" }) : ""}
            </span>
            {typeInfo && (
              <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-md", typeInfo.color)}>
                {typeInfo.label}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[12px] overflow-hidden" style={{ background: "#0a1a2b", border: "1px solid #1b3b59" }}>
      <div className="shimmer aspect-video w-full" />
      <div className="p-3 space-y-2">
        <div className="shimmer h-3 w-3/4 rounded-full" />
        <div className="shimmer h-2.5 w-1/3 rounded-full" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [films, setFilms]   = useState<FilmType[]>([]);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [search, setSearch]   = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [result, cr] = await Promise.all([
        api.listFilms(token, 12, 0),           // only 12 most recent for dashboard
        api.getCredits(token).catch(() => ({ balance: 0 })),
      ]);
      setFilms(result.films ?? []);
      setCredits(cr.balance);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (!authLoading && !user) router.replace("/"); }, [user, authLoading, router]);
  useEffect(() => { if (token) load(); }, [token, load]);

  // Auto-refresh when there are active films
  useEffect(() => {
    if (!token) return;
    const hasActive = films.some(f => isActive(f.status));
    if (!hasActive) return;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [films, token, load]);

  const stats = {
    credits: credits ?? 0,
    active:  films.filter(f => isActive(f.status)).length,
    done:    films.filter(f => isDone(f.status)).length,
  };

  const filtered = search
    ? films.filter(f => (f.title ?? f.premise_text ?? f.prompt ?? "").toLowerCase().includes(search.toLowerCase()))
    : films;

  const displayName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Usuario";

  if (authLoading || (!user && !authLoading)) return null;

  return (
    <div className="min-h-screen flex flex-col">

      {/* Topbar — glassmorphism */}
      <div className="page-topbar flex items-start justify-between gap-4">
        <div>
          <p className="text-[#45d6f5] text-[10px] font-bold tracking-widest uppercase mb-1">Tu plataforma creativa</p>
          <h1 className="text-[#e8f2ff] text-2xl font-semibold tracking-tight leading-tight">
            Hola, {displayName} 👋
          </h1>
          <p className="text-[#91a8c0] text-sm mt-0.5">Todo tipo de contenido. Un solo motor.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6580]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar proyectos..."
              className="pl-8 pr-4 py-2 text-sm rounded-[8px] outline-none w-48"
              style={{ background: "#0a1a2b", border: "1px solid #1b3b59", color: "#e8f2ff" }}
            />
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[#91a8c0] hover:text-white transition-colors" style={{ background: "#0a1a2b", border: "1px solid #1b3b59" }}>
            <Bell size={15} />
          </button>
          <Link href="/films/new">
            <button className="btn-glow flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-[8px]">
              <Plus size={14} />
              Crear
            </button>
          </Link>
        </div>
      </div>

      <div className="px-8 pt-6 pb-10 space-y-7">

        {/* 4 Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="grid grid-cols-4 gap-3">
          {[
            { label: "Créditos disponibles", value: stats.credits.toLocaleString("es"), icon: <Coins size={16} className="text-[#f6b94b]" />, href: "/billing" },
            { label: "Proyectos activos",    value: stats.active,   icon: <Zap size={16} className="text-[#2788ff]" />,  href: null },
            { label: "Tiempo estimado",      value: "~12 min",      icon: <Clock size={16} className="text-[#45d6f5]" />, href: null },
            { label: "Videos terminados",    value: stats.done,     icon: <CheckCircle2 size={16} className="text-[#29c58b]" />, href: "/films" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.35 }}>
              {s.href ? (
                <Link href={s.href} className="block group">
                  <div className="p-4 rounded-[12px] transition-all duration-200 group-hover:border-[#3173a8]" style={{ background: "linear-gradient(145deg,#0c2034,#091827)", border: "1px solid #1b3b59" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#91a8c0] text-xs">{s.label}</span>
                      {s.icon}
                    </div>
                    <p className="text-[#e8f2ff] text-2xl font-semibold">{s.value}</p>
                  </div>
                </Link>
              ) : (
                <div className="p-4 rounded-[12px]" style={{ background: "linear-gradient(145deg,#0c2034,#091827)", border: "1px solid #1b3b59" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#91a8c0] text-xs">{s.label}</span>
                    {s.icon}
                  </div>
                  <p className="text-[#e8f2ff] text-2xl font-semibold">{s.value}</p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Tus proyectos */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[#e8f2ff] text-base font-semibold">Tus proyectos</h2>
              <p className="text-[#4a6580] text-xs mt-0.5">Continúa donde lo dejaste.</p>
            </div>
            <Link href="/films" className="flex items-center gap-1 text-[#2788ff] text-xs hover:text-[#45d6f5] transition-colors">
              Ver biblioteca <ChevronRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : films.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 rounded-[14px] text-center" style={{ background: "#0a1a2b", border: "1px dashed #1b3b59" }}>
              <div className="empty-state-icon">
                <Video size={26} />
              </div>
              <p className="text-[#e8f2ff] font-medium mb-1">Tu primer proyecto te espera</p>
              <p className="text-[#91a8c0] text-sm mb-5 max-w-xs">Films, series, reels, anuncios, documentales — describe tu idea y la IA la produce.</p>
              <Link href="/films/new">
                <button className="btn-glow flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-[8px]">
                  <Plus size={15} /> Crear primer proyecto
                </button>
              </Link>
            </div>
          ) : (
            <AnimatePresence>
              <div className="grid grid-cols-4 gap-3">
                {(search ? filtered : films).slice(0, 8).map(film => (
                  <FilmCard key={film.id ?? film.film_id} film={film} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.section>

        {/* ¿Qué quieres crear? */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.4 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[#e8f2ff] text-base font-semibold">¿Qué quieres crear?</h2>
              <p className="text-[#4a6580] text-xs mt-0.5">Un motor universal con flujos adaptados al formato.</p>
            </div>
            <Link href="/content" className="flex items-center gap-1 text-[#2788ff] text-xs hover:text-[#45d6f5] transition-colors">
              <LayoutGrid size={11} /> Explorar formatos <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {CREATE_CATS.map(cat => {
              const Icon = cat.icon;
              return (
                <Link key={cat.cat} href={`/films/new?cat=${cat.cat}`}>
                  <div
                    className="flex items-center gap-3 p-4 rounded-[12px] cursor-pointer transition-all duration-200 hover:translate-y-[-2px] hover:border-[#3173a8]"
                    style={{ background: "linear-gradient(145deg,#0c2034,#091827)", border: "1px solid #1b3b59" }}
                  >
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: cat.bg }}>
                      <Icon size={18} style={{ color: cat.color }} />
                    </div>
                    <div>
                      <p className="text-[#e8f2ff] text-sm font-medium leading-tight">{cat.label}</p>
                      <p className="text-[#4a6580] text-xs mt-0.5">{cat.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* Acciones rápidas */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.4 }}>
          <h2 className="text-[#e8f2ff] text-base font-semibold mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Plus,        label: "Crear contenido",      desc: "Empieza desde una premisa o referencia", href: "/films/new" },
              { icon: Film,        label: "Explorar storyboard",  desc: "Revisa planos y continuidad",             href: "/films" },
              { icon: Clapperboard,label: "Herramientas creativas",desc: "Audio, doblaje y mejora visual",          href: "/post" },
            ].map(a => {
              const Icon = a.icon;
              return (
                <Link key={a.href + a.label} href={a.href}>
                  <div
                    className="flex items-center gap-3 p-4 rounded-[12px] cursor-pointer transition-all duration-200 hover:translate-y-[-2px] hover:border-[#3173a8]"
                    style={{ background: "linear-gradient(145deg,#0c2034,#091827)", border: "1px solid #1b3b59" }}
                  >
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#123a5e" }}>
                      <Icon size={18} className="text-[#45d6f5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#e8f2ff] text-sm font-medium">{a.label}</p>
                      <p className="text-[#4a6580] text-xs mt-0.5">{a.desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-[#4a6580] shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.section>

      </div>
    </div>
  );
}
