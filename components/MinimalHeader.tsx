"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Coins, Settings, CreditCard, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { AuthModal } from "./AuthModal";

export function MinimalHeader() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    api.getCredits(token).then(r => setCredits(r.balance)).catch(() => {});
  }, [token]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Usuario";

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center h-14"
        style={{
          background: "rgba(6, 17, 31, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-between w-full px-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-7 h-7 rounded-[8px] flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #2788ff, #45d6f5)" }}
            >
              <Play size={12} fill="white" className="text-white ml-0.5" />
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">CineGen</span>
          </Link>

          {/* Center nav — absolutely centered */}
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
            <Link
              href="/my-videos"
              className="text-sm text-[#91a8c0] hover:text-white transition-colors duration-150"
            >
              Mis Videos
            </Link>
            {user && credits !== null && (
              <Link
                href="/billing"
                className="flex items-center gap-1.5 text-sm text-[#f6b94b] hover:text-[#ffd27c] transition-colors duration-150"
              >
                <Coins size={13} />
                {credits.toLocaleString("es")} CR
              </Link>
            )}
          </nav>

          {/* Right — avatar / login */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(v => !v)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-white/5 transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #2788ff, #45d6f5)" }}
                  >
                    {initials}
                  </div>
                  <span className="text-[#91a8c0] text-sm hidden sm:block">{displayName}</span>
                  <ChevronDown size={12} className="text-[#4a6580]" />
                </button>

                {dropOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-44 rounded-[12px] overflow-hidden py-1"
                    style={{
                      background: "#0a1a2b",
                      border: "1px solid #1b3b59",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                    }}
                  >
                    {[
                      { icon: Settings, label: "Configuración", href: "/settings" },
                      { icon: CreditCard, label: "Facturación", href: "/billing" },
                    ].map(item => (
                      <button
                        key={item.href}
                        onClick={() => { setDropOpen(false); router.push(item.href); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#91a8c0] hover:text-white hover:bg-[#0d2237] transition-colors text-left"
                      >
                        <item.icon size={14} />
                        {item.label}
                      </button>
                    ))}
                    <div style={{ borderTop: "1px solid #1b3b59", margin: "4px 0" }} />
                    <button
                      onClick={() => { setDropOpen(false); logout(); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#ff6578] hover:bg-[#0d2237] transition-colors text-left"
                    >
                      <LogOut size={14} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="px-4 py-1.5 rounded-[8px] text-sm font-medium text-white transition-all"
                style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
