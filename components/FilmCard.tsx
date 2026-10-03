"use client";

import { motion } from "framer-motion";
import { Film, Clock, CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { type Film as FilmType } from "@/lib/api";
import { cn } from "@/lib/cn";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pendiente", color: "text-[#8e8e93]", icon: Clock },
  queued: { label: "En cola", color: "text-[#ff9f0a]", icon: Clock },
  generating: { label: "Generando", color: "text-[#0a84ff]", icon: Loader2 },
  assembling: { label: "Ensamblando", color: "text-[#bf5af2]", icon: Loader2 },
  done: { label: "Listo", color: "text-[#30d158]", icon: CheckCircle },
  ready: { label: "Listo", color: "text-[#30d158]", icon: CheckCircle },
  failed: { label: "Error", color: "text-[#ff3b30]", icon: XCircle },
  cancelled: { label: "Cancelado", color: "text-[#8e8e93]", icon: XCircle },
};

interface FilmCardProps {
  film: FilmType;
  onDelete?: (id: string) => void;
}

export function FilmCard({ film, onDelete }: FilmCardProps) {
  const cfg = statusConfig[film.status] ?? statusConfig.pending;
  const Icon = cfg.icon;
  const isProcessing = ["generating", "assembling"].includes(film.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="group relative bg-[#1c1c1e] rounded-[20px] overflow-hidden border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
    >
      {/* Thumbnail */}
      <Link href={`/films/${film.id}`}>
        <div className="relative aspect-video bg-black overflow-hidden">
          {film.thumbnail_url ? (
            <img
              src={film.thumbnail_url}
              alt={film.prompt}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#0a84ff]/30 border-t-[#0a84ff] rounded-full animate-spin" />
                  <span className="text-xs text-[#48484a]">Procesando...</span>
                </div>
              ) : (
                <Film size={32} className="text-[#3a3a3c]" />
              )}
            </div>
          )}
          {film.status === "done" && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-white ml-1" />
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-5">
        <p className="text-white text-sm font-medium line-clamp-2 leading-relaxed mb-3">
          {film.prompt}
        </p>
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-1.5 text-xs font-medium", cfg.color)}>
            <Icon size={13} className={isProcessing ? "animate-spin" : ""} />
            {cfg.label}
          </div>
          <div className="flex items-center gap-3">
            {film.duration_seconds && (
              <span className="text-[#48484a] text-xs">{film.duration_seconds}s</span>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.preventDefault(); onDelete(film.id); }}
                className="opacity-0 group-hover:opacity-100 text-[#48484a] hover:text-[#ff3b30] transition-all duration-200"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
