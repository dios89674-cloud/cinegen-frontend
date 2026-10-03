"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Play, Home, Library, LayoutGrid, Plus, Monitor, Layers, Scissors, Wand2,
  Users, ShoppingBag, Coins, Settings, LogOut, ChevronRight, Bell
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { AuthModal } from "./AuthModal";

const WORKSPACE_NAV: { href: string; label: string; icon: React.ElementType; pattern: RegExp }[] = [
  { href: "/dashboard",   label: "Inicio",                  icon: Home,        pattern: /^\/dashboard/ },
  { href: "/films",       label: "Biblioteca de contenido", icon: Library,     pattern: /^\/films$/ },
  { href: "/content",     label: "Tipos de contenido",      icon: LayoutGrid,  pattern: /^\/content/ },
  { href: "/films/new",   label: "Crear contenido",         icon: Plus,        pattern: /^\/films\/new/ },
  { href: "/films",       label: "Production Monitor",      icon: Monitor,     pattern: /^\/films\/(?!new)[^/]+$/ },
  { href: "/films",       label: "Storyboard & Shot Room",  icon: Layers,      pattern: /^\/films\/[^/]+\/storyboard/ },
  { href: "/films",       label: "Final Cut",               icon: Scissors,    pattern: /^\/films\/[^/]+\/finalcut/ },
  { href: "/post",        label: "Postproducción",          icon: Wand2,       pattern: /^\/post/ },
  { href: "/actors",      label: "Actores digitales",       icon: Users,       pattern: /^\/actors/ },
  { href: "/marketplace", label: "Marketplace",             icon: ShoppingBag, pattern: /^\/marketplace/ },
];

const ACCOUNT_NAV: { href: string; label: string; icon: React.ElementType; pattern: RegExp }[] = [
  { href: "/billing",  label: "Créditos y facturación", icon: Coins,    pattern: /^\/billing/ },
  { href: "/settings", label: "Configuración",          icon: Settings, pattern: /^\/settings/ },
];

export function Sidebar() {
  const { user, token, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [lastFilmId, setLastFilmId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.getCredits(token).then(r => setCredits(r.balance)).catch(() => {});
    // Load most recent film ID for per-film nav links
    api.listFilms(token, 5, 0).then(result => {
      const films = result.films ?? [];
      if (films.length > 0) {
        // Backend already returns newest first; just take the first
        setLastFilmId(films[0].id ?? films[0].film_id ?? null);
      }
    }).catch(() => {});
  }, [token]);

  // Resolve href for per-film items that need a real film ID
  const resolveHref = (href: string, label: string) => {
    if (label === "Production Monitor" && lastFilmId) return `/films/${lastFilmId}`;
    if (label === "Storyboard & Shot Room" && lastFilmId) return `/films/${lastFilmId}/storyboard`;
    if (label === "Final Cut" && lastFilmId) return `/films/${lastFilmId}`;
    return href;
  };

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Usuario";

  return (
    <>
      <aside
        className="fixed top-0 left-0 h-screen w-[245px] flex flex-col z-40"
        style={{
          background: "#071524",
          borderRight: "1px solid #1b3b59",
        }}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-[#1b3b59]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #2788ff 0%, #45d6f5 100%)" }}
            >
              <Play size={14} className="text-white ml-0.5" fill="white" />
            </div>
            <div>
              <p className="text-white font-semibold text-[15px] leading-tight tracking-tight">CineGen</p>
              <p className="text-[#4a6580] text-[9px] font-medium tracking-widest uppercase leading-tight">Universal Content Engine</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {/* Workspace section */}
          <p className="text-[#4a6580] text-[10px] font-semibold tracking-widest uppercase px-2 pt-2 pb-2">Workspace</p>
          {WORKSPACE_NAV.map(({ href, label, icon: Icon, pattern }) => {
            const isActive = pattern.test(pathname);
            const resolvedHref = user ? resolveHref(href, label) : "#";
            const needsFilm = ["Production Monitor", "Storyboard & Shot Room", "Final Cut"].includes(label);
            return (
              <Link
                key={label}
                href={resolvedHref}
                onClick={e => {
                  if (!user) { e.preventDefault(); setShowAuth(true); return; }
                  if (needsFilm && !lastFilmId) { e.preventDefault(); router.push("/films"); }
                }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-sm transition-all duration-150",
                  isActive
                    ? "text-white border-l-[3px] border-l-[#2788ff] rounded-l-none pl-[9px]"
                    : "text-[#91a8c0] hover:text-white hover:bg-[#0d2237]"
                )}
                style={isActive ? {
                  background: "linear-gradient(90deg, #0f4380 0%, #102b47 100%)",
                  borderLeft: "3px solid #2788ff",
                } : {}}
              >
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            );
          })}

          {/* Account section */}
          <p className="text-[#4a6580] text-[10px] font-semibold tracking-widest uppercase px-2 pt-4 pb-2">Cuenta</p>
          {ACCOUNT_NAV.map(({ href, label, icon: Icon, pattern }) => {
            const isActive = pattern.test(pathname);
            return (
              <Link
                key={href}
                href={user ? href : "#"}
                onClick={e => { if (!user) { e.preventDefault(); setShowAuth(true); } }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-sm transition-all duration-150",
                  isActive
                    ? "text-white border-l-[3px] border-l-[#2788ff] rounded-l-none pl-[9px]"
                    : "text-[#91a8c0] hover:text-white hover:bg-[#0d2237]"
                )}
                style={isActive ? {
                  background: "linear-gradient(90deg, #0f4380 0%, #102b47 100%)",
                  borderLeft: "3px solid #2788ff",
                } : {}}
              >
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Credits card */}
        {user && (
          <div className="mx-3 mb-3 p-3 rounded-[10px]" style={{ background: "#0a1a2b", border: "1px solid #1b3b59" }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[#91a8c0] text-xs">Créditos disponibles</span>
              <Coins size={12} className="text-[#f6b94b]" />
            </div>
            <p className="text-white text-xl font-semibold mb-2">
              {credits !== null ? credits.toLocaleString() : "—"}
            </p>
            <Link
              href="/billing"
              className="flex items-center justify-between w-full text-[#2788ff] text-xs font-medium hover:text-[#45d6f5] transition-colors"
            >
              Gestionar créditos
              <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {/* Avatar row */}
        <div className="px-3 pb-4 border-t border-[#1b3b59] pt-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold"
                style={{ background: "linear-gradient(135deg, #2788ff, #45d6f5)" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{displayName}</p>
                <p className="text-[#4a6580] text-[10px] truncate">Free plan</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#4a6580] hover:text-white hover:bg-[#0d2237] transition-all"
                  title="Notificaciones"
                >
                  <Bell size={13} />
                </button>
                <button
                  onClick={logout}
                  className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#4a6580] hover:text-[#ff6578] hover:bg-[#0d2237] transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="w-full py-2 px-3 rounded-[8px] text-sm font-medium text-white transition-all"
              style={{ background: "linear-gradient(135deg, #2788ff, #1a5fe0)" }}
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </aside>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
