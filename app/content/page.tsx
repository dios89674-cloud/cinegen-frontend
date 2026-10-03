"use client";


import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clapperboard, Smartphone, Megaphone, GraduationCap, Camera, Mic, Trophy, Music } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const CARD: React.CSSProperties = {
  background: "linear-gradient(145deg, #0c2034, #091827)",
  border: "1px solid #1b3b59",
  borderRadius: 14,
  padding: 18,
  cursor: "pointer",
  transition: "transform 0.15s, border-color 0.15s",
};

const ICON_BOX: React.CSSProperties = {
  width: 42, height: 42, borderRadius: 12,
  background: "#123a5e",
  display: "grid", placeItems: "center",
  flexShrink: 0,
  color: "#45d6f5",
};

const FORMATS = [
  {
    icon: Clapperboard,
    label: "Películas y ficción",
    desc: "Corto, largometraje, miniserie, serie y antología",
    type: "SHORT_FILM",
  },
  {
    icon: Smartphone,
    label: "Contenido social",
    desc: "Shorts, reels, anuncios verticales y clips",
    type: "SOCIAL_SHORT",
  },
  {
    icon: Megaphone,
    label: "Marketing y marca",
    desc: "Publicidad, brand film y vídeo de producto",
    type: "ADVERTISEMENT",
  },
  {
    icon: GraduationCap,
    label: "Educación y formación",
    desc: "Tutoriales, explicadores y capacitación",
    type: "EXPLAINER",
  },
  {
    icon: Camera,
    label: "Documental y actualidad",
    desc: "Documentales, reportajes y noticias",
    type: "DOCUMENTARY",
  },
  {
    icon: Mic,
    label: "Podcast y entrevistas",
    desc: "Videopodcast, testimonios y entrevistas",
    type: "PODCAST_VIDEO",
  },
  {
    icon: Trophy,
    label: "Eventos y deportes",
    desc: "Highlights, recap y resúmenes",
    type: "EVENT_HIGHLIGHT",
  },
  {
    icon: Music,
    label: "Música y performance",
    desc: "Videoclips, visualizers y piezas musicales",
    type: "MUSIC_VIDEO",
  },
];

export default function ContentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  return (
    <div style={{ color: "#e8f2ff", padding: "28px clamp(18px,3vw,42px) 42px" }}>
      {/* Topbar */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: "#45d6f5", fontSize: 11, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 800, margin: 0 }}>Explorador universal</p>
        <h1 style={{ fontSize: "clamp(24px,3vw,34px)", letterSpacing: "-1.2px", margin: "4px 0 5px", fontWeight: 700 }}>Tipos de contenido</h1>
        <p style={{ color: "#91a8c0", margin: 0 }}>Elige el formato y deja que CineGen adapte el flujo de producción.</p>
      </div>

      {/* Format grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 20 }}>
        {FORMATS.map(f => {
          const Icon = f.icon;
          return (
            <Link key={f.type} href={`/films/new?type=${f.type}`} style={{ textDecoration: "none" }}>
              <div
                style={CARD}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#3173a8";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#1b3b59";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <div style={ICON_BOX}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: 14, color: "#e8f2ff", marginBottom: 3 }}>{f.label}</strong>
                    <small style={{ color: "#91a8c0", fontSize: 12 }}>{f.desc}</small>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Info card */}
      <div style={{
        background: "linear-gradient(145deg, #0c2034, #091827)",
        border: "1px solid #1b3b59",
        borderRadius: 14,
        padding: 24,
      }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 700 }}>El mismo motor, flujos especializados</h2>
        <p style={{ color: "#91a8c0", margin: "0 0 18px", lineHeight: 1.6 }}>
          El formato elegido determina qué estructura narrativa, validaciones, herramientas y etapas aparecen.
          Las funciones disponibles dependen del modo y de las capacidades habilitadas en el backend.
        </p>
        <Link href="/films/new" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "linear-gradient(135deg, #1680ff, #1763d5)",
          border: "1px solid #368fff",
          boxShadow: "0 7px 18px #0068ff25",
          color: "white", borderRadius: 10, padding: "11px 20px",
          fontSize: 14, fontWeight: 600, textDecoration: "none",
        }}>
          Crear contenido →
        </Link>
      </div>
    </div>
  );
}
