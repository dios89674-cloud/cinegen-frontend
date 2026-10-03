"use client";


import { useState, useEffect } from "react";
import { Mic, Globe, Sparkles, Music, FileText, Sliders, Bell, Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const CARD_STYLE = {
  background: "linear-gradient(145deg, #0c2034, #091827)",
  border: "1px solid #1b3b59",
  borderRadius: "14px",
  padding: "18px",
};

const STAT_ICON_STYLE = {
  width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center",
  borderRadius: "12px", background: "#123a5e", color: "#73dff8", marginBottom: "12px",
};

const FIELD_STYLE = {
  display: "grid", gap: "7px", marginBottom: "17px",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", background: "#061523", border: "1px solid #24435f",
  color: "#e8f2ff", borderRadius: "9px", padding: "10px 12px", outline: "none", fontSize: "14px",
};

const BTN_PRIMARY: React.CSSProperties = {
  background: "linear-gradient(135deg, #1680ff, #1763d5)", border: "1px solid #368fff",
  color: "white", borderRadius: "10px", padding: "10px 14px", cursor: "pointer",
  width: "100%", fontSize: "13px", fontWeight: 600, marginTop: "4px",
};

const BTN_GHOST: React.CSSProperties = {
  background: "#0c2034", border: "1px solid #1b3b59",
  color: "#e8f2ff", borderRadius: "10px", padding: "10px 14px", cursor: "pointer",
  width: "100%", fontSize: "13px", fontWeight: 500,
};

const TOOLS = [
  {
    icon: <Mic size={20} />,
    title: "Doblaje",
    desc: "Genera o gestiona pistas de voz para tus producciones.",
    field: { label: "Idioma de destino", options: ["Español latino", "English (US)", "Português", "Français"] },
    btn: "Configurar doblaje",
  },
  {
    icon: <Globe size={20} />,
    title: "Localización",
    desc: "Adapta diálogos y textos a otros idiomas.",
    field: { label: "Idioma", options: ["English (US)", "Español latino", "Português"] },
    btn: "Preparar localización",
  },
  {
    icon: <Sparkles size={20} />,
    title: "Mejora visual",
    desc: "Solicita upscale cuando el vídeo y el proveedor lo permitan.",
    field: { label: "Salida objetivo", options: ["1080p", "4K"] },
    btn: "Configurar upscale",
  },
  {
    icon: <Music size={20} />,
    title: "Música y audio",
    desc: "Gestiona música y pistas de audio para la entrega.",
    field: null,
    btn: "Abrir herramienta",
  },
  {
    icon: <FileText size={20} />,
    title: "Transcripción",
    desc: "Consulta o genera texto a partir del audio del proyecto.",
    field: null,
    btn: "Ver transcripción",
  },
  {
    icon: <Sliders size={20} />,
    title: "Audio post",
    desc: "Procesamiento de audio según las capacidades disponibles.",
    field: null,
    btn: "Configurar audio",
  },
];

export default function PostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen" style={{ background: "#06111f", color: "#e8f2ff" }}>
      <div style={{ padding: "28px clamp(18px,3vw,42px) 42px" }}>
        {/* Topbar */}
        <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, marginBottom: 28 }}>
          <div>
            <div style={{ color: "#45d6f5", fontSize: 11, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 800, marginBottom: 4 }}>
              Postproducción
            </div>
            <h1 style={{ fontSize: "clamp(25px,3vw,34px)", letterSpacing: "-1.2px", margin: "4px 0 5px", fontWeight: 700 }}>
              Herramientas creativas
            </h1>
            <p style={{ color: "#91a8c0", margin: 0 }}>
              Mejora el audio, localiza el contenido y prepara versiones de entrega.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ background: "#0a1b2d", border: "1px solid #1b3b59", borderRadius: 10, padding: "10px 13px", display: "flex", alignItems: "center", gap: 8 }}>
              <Search size={14} style={{ color: "#91a8c0" }} />
              <span style={{ color: "#91a8c0", fontSize: 13 }}>Buscar...</span>
            </div>
            <button style={{ width: 40, height: 40, background: "#0c2034", border: "1px solid #1b3b59", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#91a8c0" }}>
              <Bell size={16} />
            </button>
          </div>
        </header>

        {/* 3-column grid of 6 tools */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16, marginBottom: 16 }}>
          {TOOLS.map((tool) => (
            <div key={tool.title} style={CARD_STYLE}>
              <div style={STAT_ICON_STYLE}>{tool.icon}</div>
              <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>{tool.title}</h2>
              <p style={{ color: "#91a8c0", fontSize: 13, margin: "0 0 14px" }}>{tool.desc}</p>
              {tool.field && (
                <div style={FIELD_STYLE}>
                  <label style={{ fontSize: 12, color: "#b9cce0", fontWeight: 650 }}>{tool.field.label}</label>
                  <select style={INPUT_STYLE}>
                    {tool.field.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              )}
              <button
                style={BTN_PRIMARY}
                onClick={() => showToast("Para usar esta herramienta, abre el proyecto desde la biblioteca y navega a Final Cut.")}
              >
                {tool.btn}
              </button>
            </div>
          ))}
        </div>

        {/* Info card */}
        <div style={{ ...CARD_STYLE, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: 14 }}>
              Selecciona primero un proyecto de tu biblioteca para aplicar estas herramientas.
            </p>
            <p style={{ color: "#91a8c0", fontSize: 12, margin: "4px 0 0" }}>
              Cada herramienta opera sobre una producción existente y puede consumir créditos.
            </p>
          </div>
          <Link
            href="/films"
            style={{ ...BTN_PRIMARY, width: "auto", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          >
            Ir a la biblioteca <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 22, right: 22,
          background: "#103a30", border: "1px solid #23765f", color: "#b4f5dc",
          padding: "13px 17px", borderRadius: 10, boxShadow: "0 10px 35px rgba(0,0,0,0.3)",
          fontSize: 13, maxWidth: 380, zIndex: 100,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
