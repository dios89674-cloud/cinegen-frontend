"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Play, Download, CheckCircle2, Loader2, AlertCircle, Film, Music, Trash2, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Edit } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export default function EditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [edit, setEdit] = useState<Edit | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editId = Array.isArray(id) ? id[0] : id;

  const fetch = useCallback(async () => {
    if (!token || !editId) return;
    try {
      const data = await api.getEdit(token, editId);
      setEdit(data);
      setLoading(false);
      if (data.status === "ready" || data.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch { setLoading(false); }
  }, [token, editId]);

  useEffect(() => { if (!authLoading && !user) router.replace("/"); }, [user, authLoading, router]);
  useEffect(() => {
    if (!token) return;
    fetch();
    pollRef.current = setInterval(fetch, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token, fetch]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const kind = file.type.startsWith("audio") ? "audio" : "video";
      await api.uploadClip(token, editId, file, kind, file.name);
      await fetch();
    } catch { /* ignore */ }
    finally { setUploading(false); if (e.target) e.target.value = ""; }
  };

  const handleStart = async () => {
    if (!token) return;
    setStarting(true);
    try { await api.startEdit(token, editId); await fetch(); }
    catch { /* ignore */ }
    finally { setStarting(false); }
  };

  const handleDownload = async () => {
    if (!token) return;
    setDownloading(true);
    try {
      const { download_url } = await api.downloadEdit(token, editId);
      const a = document.createElement("a");
      a.href = download_url; a.download = `edit-${editId}.mp4`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch { /* ignore */ }
    finally { setDownloading(false); }
  };

  const isProcessing = edit?.status === "processing";
  const isReady = edit?.status === "ready";
  const canStart = edit?.status === "awaiting_clips" && (edit.clips?.length ?? 0) > 0;

  return (
    <div className="min-h-screen pt-24 pb-28 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.button initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/edits")}
          className="flex items-center gap-2 text-[#48484a] hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Editor IA
        </motion.button>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-[#0a84ff]/30 border-t-[#0a84ff] rounded-full animate-spin" />
          </div>
        ) : !edit ? (
          <div className="text-center py-32 text-[#48484a]">Proyecto no encontrado.</div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-2xl font-semibold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
                Proyecto de edición
              </h1>
              <p className="text-[#8e8e93] text-sm mt-1.5 leading-relaxed">{edit.instructions}</p>
            </motion.div>

            {/* Status */}
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-[16px] border",
              isReady ? "bg-[#30d158]/8 border-[#30d158]/20" :
              isProcessing ? "bg-[#0a84ff]/8 border-[#0a84ff]/20" :
              "bg-[#0f0f0f] border-white/[0.07]"
            )}>
              {isReady ? <CheckCircle2 size={18} className="text-[#30d158] shrink-0" /> :
               isProcessing ? <Loader2 size={18} className="text-[#0a84ff] animate-spin shrink-0" /> :
               <AlertCircle size={18} className="text-[#48484a] shrink-0" />}
              <div>
                <p className="text-white text-sm font-medium">
                  {isReady ? "Edición completada" : isProcessing ? "Procesando clips..." : "Esperando clips"}
                </p>
                <p className="text-[#48484a] text-xs mt-0.5">
                  {isReady ? "Tu video está listo para descargar" :
                   isProcessing ? "La IA está montando tu video" :
                   "Sube al menos un clip para comenzar"}
                </p>
              </div>
            </div>

            {/* Clips */}
            <div className="bg-[#0f0f0f] border border-white/[0.07] rounded-[24px] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-medium">Clips · {edit.clips?.length ?? 0}</p>
                {edit.status === "awaiting_clips" && (
                  <>
                    <input ref={fileRef} type="file" accept="video/*,audio/*" className="hidden" onChange={handleUpload} />
                    <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} loading={uploading}>
                      <Plus size={14} /> Subir clip
                    </Button>
                  </>
                )}
              </div>

              {(!edit.clips || edit.clips.length === 0) ? (
                <div
                  onClick={() => edit.status === "awaiting_clips" && fileRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed border-white/[0.07] rounded-[16px] p-10 text-center transition-colors",
                    edit.status === "awaiting_clips" && "hover:border-white/15 cursor-pointer"
                  )}
                >
                  <Upload size={24} className="text-[#2c2c2e] mx-auto mb-3" />
                  <p className="text-[#48484a] text-sm">
                    {edit.status === "awaiting_clips" ? "Arrastra tus clips aquí o haz clic para subir" : "Sin clips"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {edit.clips.map((clip, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[#141414] rounded-[12px]">
                      {clip.kind === "audio"
                        ? <Music size={16} className="text-[#bf5af2] shrink-0" />
                        : <Film size={16} className="text-[#0a84ff] shrink-0" />}
                      <p className="text-white text-sm flex-1 truncate">{clip.description ?? `Clip ${i + 1}`}</p>
                      <span className="text-[#48484a] text-xs capitalize">{clip.kind}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {isReady ? (
                <Button onClick={handleDownload} loading={downloading} size="lg" className="flex-1">
                  <Download size={18} /> Descargar edición
                </Button>
              ) : canStart ? (
                <Button onClick={handleStart} loading={starting} size="lg" className="flex-1">
                  <Play size={18} /> Iniciar edición IA
                </Button>
              ) : isProcessing ? (
                <div className="flex-1 flex items-center gap-2 text-[#8e8e93] text-sm">
                  <Loader2 size={16} className="animate-spin" /> Procesando...
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
