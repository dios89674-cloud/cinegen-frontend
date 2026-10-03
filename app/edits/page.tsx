"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Scissors, Loader2, CheckCircle2, AlertCircle, X, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Edit } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

const STATUS_CFG: Record<string, { label: string; pill: string; icon: React.ReactNode }> = {
  awaiting_clips: { label: "Esperando clips", pill: "bg-[#ff9f0a]/10 text-[#ff9f0a]", icon: <Upload size={11} /> },
  processing:     { label: "Procesando",      pill: "bg-[#0a84ff]/10 text-[#0a84ff]", icon: <Loader2 size={11} className="animate-spin" /> },
  ready:          { label: "Listo",           pill: "bg-[#30d158]/10 text-[#30d158]", icon: <CheckCircle2 size={11} /> },
  failed:         { label: "Error",           pill: "bg-[#ff3b30]/10 text-[#ff3b30]", icon: <AlertCircle size={11} /> },
  cancelled:      { label: "Cancelado",       pill: "bg-white/5 text-[#48484a]",      icon: <X size={11} /> },
  blocked_insufficient_credits: { label: "Sin créditos", pill: "bg-[#ff9f0a]/10 text-[#ff9f0a]", icon: <AlertCircle size={11} /> },
};

function EditCard({ edit }: { edit: Edit }) {
  const cfg = STATUS_CFG[edit.status] ?? STATUS_CFG.awaiting_clips;
  const editId = edit.edit_id;
  return (
    <Link href={`/edits/${editId}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }} transition={{ duration: 0.2 }}
        className="bg-[#0f0f0f] border border-white/[0.05] hover:border-white/10 rounded-[20px] p-5 transition-all duration-300 cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-[#bf5af2]/10 rounded-[12px] flex items-center justify-center">
            <Scissors size={18} className="text-[#bf5af2]" />
          </div>
          <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold", cfg.pill)}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
        <p className="text-white text-sm font-medium line-clamp-2 leading-snug mb-2">{edit.instructions}</p>
        <p className="text-[#48484a] text-xs">
          {edit.created_at ? new Date(edit.created_at).toLocaleDateString("es", { day: "numeric", month: "short" }) : ""}
          {edit.clips?.length ? ` · ${edit.clips.length} clip${edit.clips.length !== 1 ? "s" : ""}` : ""}
        </p>
      </motion.div>
    </Link>
  );
}

function CreateEditModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { token } = useAuth();
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!token || !instructions.trim()) return;
    setLoading(true);
    try {
      const res = await api.createEdit(token, instructions.trim());
      onCreated(res.edit_id);
      onClose();
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo proyecto de edición">
      <p className="text-[#8e8e93] text-sm mb-5">
        Describe cómo quieres que la IA edite tus clips. Puedes subir los videos después.
      </p>
      <textarea
        value={instructions}
        onChange={e => setInstructions(e.target.value)}
        placeholder="Ej: Crea un montaje de 60 segundos con música épica. Incluye transiciones cinematográficas entre los clips de acción..."
        rows={5}
        autoFocus
        className="w-full bg-[#141414] text-white placeholder-[#3a3a3c] rounded-[14px] px-5 py-4 text-sm resize-none border border-white/[0.07] outline-none focus:border-white/20 transition-all leading-relaxed mb-5"
      />
      <Button onClick={handleCreate} loading={loading} disabled={instructions.trim().length < 10} className="w-full" size="lg">
        Crear proyecto
      </Button>
    </Modal>
  );
}

export default function EditsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [edits, setEdits] = useState<Edit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.listEdits(token);
      setEdits(Array.isArray(data) ? data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (!authLoading && !user) router.replace("/"); }, [user, authLoading, router]);
  useEffect(() => { if (token) load(); }, [token, load]);

  const handleCreated = (id: string) => router.push(`/edits/${id}`);

  if (authLoading || (!user && !authLoading)) return null;

  return (
    <div className="min-h-screen pt-24 pb-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <h1 className="text-4xl font-semibold text-white tracking-tight" style={{ letterSpacing: "-0.025em" }}>Editor IA</h1>
            <p className="text-[#48484a] mt-1.5 text-sm">Sube tus clips y la IA los edita según tus instrucciones</p>
          </div>
          <Button size="lg" onClick={() => setShowCreate(true)}><Plus size={18} /> Nuevo proyecto</Button>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#0f0f0f] border border-white/[0.05] rounded-[20px] p-5 space-y-3">
                <div className="shimmer w-10 h-10 rounded-[12px]" />
                <div className="shimmer h-3 w-3/4 rounded-full" />
                <div className="shimmer h-2.5 w-1/2 rounded-full" />
              </div>
            ))}
          </div>
        ) : edits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-[#0f0f0f] border border-white/[0.06] rounded-[24px] flex items-center justify-center mb-6">
              <Scissors size={28} className="text-[#2c2c2e]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Sin proyectos de edición</h2>
            <p className="text-[#48484a] mb-8 max-w-xs">Sube tus clips y describe cómo quieres el resultado. La IA hace el montaje.</p>
            <Button size="lg" onClick={() => setShowCreate(true)}><Plus size={18} /> Crear proyecto</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {edits.map(e => <EditCard key={e.edit_id} edit={e} />)}
          </div>
        )}
      </div>

      <CreateEditModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
    </div>
  );
}
