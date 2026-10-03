"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Trash2, Upload, Camera, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, type DigitalActor } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

function ActorCard({ actor, onDelete }: { actor: DigitalActor; onDelete: (id: string) => void }) {
  const face = actor.face_url ?? actor.face_frames?.[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="group bg-[#0f0f0f] border border-white/[0.05] hover:border-white/10 rounded-[20px] overflow-hidden transition-all duration-300"
    >
      {/* Face */}
      <div className="aspect-square bg-[#0a0a0a] relative overflow-hidden">
        {face ? (
          <img src={face} alt={actor.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users size={32} className="text-[#2c2c2e]" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-semibold",
            actor.mode === "face_swap" ? "bg-[#0a84ff]/20 text-[#0a84ff]" : "bg-[#bf5af2]/20 text-[#bf5af2]"
          )}>
            {actor.mode === "face_swap" ? "Face Swap" : "Portrait"}
          </span>
        </div>
      </div>
      {/* Info */}
      <div className="p-4">
        <p className="text-white text-sm font-medium truncate">{actor.name ?? "Actor sin nombre"}</p>
        {actor.description && (
          <p className="text-[#48484a] text-xs mt-0.5 truncate">{actor.description}</p>
        )}
        {actor.frame_count != null && (
          <p className="text-[#3a3a3c] text-xs mt-1">{actor.frame_count} frame{actor.frame_count !== 1 ? "s" : ""}</p>
        )}
      </div>
      {/* Delete */}
      <div className="px-4 pb-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onDelete(actor.actor_id)}
          className="text-[#3a3a3c] hover:text-[#ff3b30] text-xs flex items-center gap-1 transition-colors"
        >
          <Trash2 size={11} /> Eliminar actor
        </button>
      </div>
    </motion.div>
  );
}

function UploadActorModal({ open, onClose, onUploaded }: { open: boolean; onClose: () => void; onUploaded: () => void }) {
  const { token } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!token || !file) return;
    setLoading(true);
    try {
      await api.uploadActor(token, file, name || file.name, description);
      onUploaded();
      onClose();
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar actor digital">
      <p className="text-[#8e8e93] text-sm mb-5">
        Sube una foto o video de la persona. La IA extraerá el rostro para usar en tus films.
      </p>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-white/[0.08] hover:border-white/20 rounded-[16px] p-8 text-center cursor-pointer transition-colors mb-4"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded-[12px] mx-auto mb-3" />
        ) : (
          <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
            <Upload size={20} className="text-[#48484a]" />
          </div>
        )}
        <p className="text-[#8e8e93] text-sm">{file ? file.name : "Arrastra foto o video · o haz clic"}</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="flex items-center gap-1 text-[#48484a] text-xs"><Camera size={11} /> Foto</span>
          <span className="flex items-center gap-1 text-[#48484a] text-xs"><Video size={11} /> Video</span>
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      <div className="space-y-3 mb-5">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del actor"
          className="w-full bg-[#141414] text-white placeholder-[#3a3a3c] rounded-[12px] px-4 py-3 text-sm border border-white/[0.07] outline-none focus:border-white/20 transition-colors"
        />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción (opcional)"
          className="w-full bg-[#141414] text-white placeholder-[#3a3a3c] rounded-[12px] px-4 py-3 text-sm border border-white/[0.07] outline-none focus:border-white/20 transition-colors"
        />
      </div>

      <Button onClick={handleUpload} loading={loading} disabled={!file} className="w-full" size="lg">
        Subir actor digital
      </Button>
    </Modal>
  );
}

export default function ActorsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [actors, setActors] = useState<DigitalActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.listActors(token);
      setActors(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (!authLoading && !user) router.replace("/"); }, [user, authLoading, router]);
  useEffect(() => { if (token) load(); }, [token, load]);

  const handleDelete = async (id: string) => {
    if (!token || !confirm("¿Eliminar este actor?")) return;
    await api.deleteActor(token, id).catch(() => {});
    setActors(prev => prev.filter(a => a.actor_id !== id));
  };

  if (authLoading || (!user && !authLoading)) return null;

  return (
    <div className="min-h-screen pt-24 pb-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <h1 className="text-4xl font-semibold text-white tracking-tight" style={{ letterSpacing: "-0.025em" }}>Actores digitales</h1>
            <p className="text-[#48484a] mt-1.5 text-sm">Rostros IA para usar en tus producciones</p>
          </div>
          <Button size="lg" onClick={() => setShowUpload(true)}><Plus size={18} /> Agregar actor</Button>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#0f0f0f] rounded-[20px] overflow-hidden border border-white/[0.05]">
                <div className="shimmer aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <div className="shimmer h-3 w-2/3 rounded-full" />
                  <div className="shimmer h-2.5 w-1/2 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : actors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-[#0f0f0f] border border-white/[0.06] rounded-[24px] flex items-center justify-center mb-6">
              <Users size={28} className="text-[#2c2c2e]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Sin actores digitales</h2>
            <p className="text-[#48484a] mb-8 max-w-xs">Sube una foto o video y la IA extrae el rostro para usar en tus films.</p>
            <Button size="lg" onClick={() => setShowUpload(true)}><Plus size={18} /> Agregar primer actor</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {actors.map(a => <ActorCard key={a.actor_id} actor={a} onDelete={handleDelete} />)}
          </div>
        )}
      </div>

      <UploadActorModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={load} />
    </div>
  );
}
