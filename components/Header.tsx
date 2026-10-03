"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Film, LogOut, LayoutDashboard, Settings, Coins, Scissors, Users, ShoppingBag, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { AuthModal } from "./AuthModal";
import { NotificationBell } from "./NotificationBell";
import { Button } from "./ui/Button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/dashboard", label: "Producciones", icon: Film },
  { href: "/edits", label: "Editor", icon: Scissors },
  { href: "/actors", label: "Actores", icon: Users },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
];

export function Header() {
  const { user, logout, token } = useAuth();
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    api.getCredits(token).then(r => setCredits(r.balance)).catch(() => {});
  }, [token]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          background: "rgba(0,0,0,0.75)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-[10px] bg-[#0a84ff] flex items-center justify-center">
              <Film size={16} className="text-white" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">CineGen</span>
          </Link>

          {/* Nav */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 flex-1">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-sm font-medium transition-all duration-200",
                    pathname.startsWith(href)
                      ? "bg-white/10 text-white"
                      : "text-[#8e8e93] hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right */}
          <div className="flex items-center gap-2 ml-auto">
            {user ? (
              <>
                {/* Credits */}
                {credits !== null && (
                  <Link href="/billing" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1e] rounded-[10px] text-sm text-[#ff9f0a] font-medium hover:bg-[#2c2c2e] transition-colors">
                    <Coins size={13} />
                    {credits.toLocaleString()}
                  </Link>
                )}

                <NotificationBell />

                <Link href="/films/new">
                  <Button size="sm" className="hidden md:flex">
                    <Plus size={14} />
                    Crear
                  </Button>
                </Link>

                <Link href="/settings">
                  <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-[#8e8e93] hover:text-white transition-all duration-200">
                    <Settings size={16} />
                  </button>
                </Link>

                <button
                  onClick={logout}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-[#8e8e93] hover:text-white transition-all duration-200"
                  title="Cerrar sesión"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setShowAuth(true)}>
                Iniciar sesión
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
