"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Loader2, ChevronDown, ChevronUp,
  Upload, X, FileVideo,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { api } from "@/lib/api";

const MODES = [
  { label: "Film corto",    type: "SHORT_FILM" },
  { label: "Largometraje", type: "FEATURE_FILM" },
  { label: "Serie TV",     type: "TV_SERIES" },
  { label: "Social / Reel",type: "SOCIAL_SHORT" },
  { label: "Anuncio",      type: "ADVERTISEMENT" },
  { label: "Documental",   type: "DOCUMENTARY" },
];

const ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "21:9"];
const DURATIONS = [
  { label: "30 s",  value: 0.5 },
  { label: "1 min", value: 1 },
  { label: "3 min", value: 3 },
  { label: "5 min", value: 5 },
  { label: "10 min",value: 10 },
  { label: "30 min",value: 30 },
  { label: "90 min",value: 90 },
];

const LOADING_MESSAGES = [
  "Analizando tu premisa…",
  "Diseñando la estructura narrativa…",
  "Generando personajes y escenas…",
  "Aplicando estilo visual…",
  "Creando el storyboard…",
  "Preparando la producción…",
];

export default function HomePage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [showAuth,     setShowAuth]     = useState(false);
  const [prompt,       setPrompt]       = useState("");
  const [mode,         setMode]         = useState("SHORT_FILM");
  const [generating,   setGenerating]   = useState(false);
  const [msgIdx,       setMsgIdx]       = useState(0);
  const [error,        setError]        = useState("");
  const [showAdv,      setShowAdv]      = useState(false);
  const [aspectRatio,  setAspectRatio]  = useState("16:9");
  const [duration,     setDuration]     = useState<number>(5);
  const [refImage,     setRefImage]     = useState<File | null>(null);
  const [refPreview,   setRefPreview]   = useState<string | null>(null);
  const [focused,      setFocused]      = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 2400);
    return () => clearInterval(t);
  }, [generating]);

  function removeRef() {
    if (refPreview) URL.revokeObjectURL(refPreview);
    setRefImage(null);
    setRefPreview(null);
  }

  async function handleGenerate() {
    if (!user || !token) { setShowAuth(true); return; }
    if (!prompt.trim()) return;
    setGenerating(true);
    setError("");
    try {
      const res = await api.createFilm(token, {
        premise_text:      prompt.trim(),
        production_type:   mode,
        aspect_ratio:      aspectRatio,
        duration_minutes:  duration,
        start_immediately: true,
      });
      router.push(`/films/${res.film_id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear el proyecto");
      setGenerating(false);
    }
  }

  // ── Shared pill style ──────────────────────────────────────────────────────
  const pill = (active: boolean) => ({
    padding: "6px 13px",
    borderRadius: 9,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    border: "1px solid",
    whiteSpace: "nowrap" as const,
    transition: "all 0.18s",
    ...(active
      ? { background: "rgba(10,132,255,0.12)", color: "#0A84FF", borderColor: "rgba(10,132,255,0.3)" }
      : { background: "transparent", color: "#555", borderColor: "transparent" }),
  });

  const labelSm: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "#3a3a3c", marginBottom: 8, display: "block",
  };

  return (
    <>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 56,
        background: "rgba(5,10,18,0.75)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg,#0A84FF,#64D2FF)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Play size={11} fill="white" color="white" style={{ marginLeft: 1 }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: "-0.3px" }}>CineGen</span>
        </div>

        {user ? (
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "7px 16px", borderRadius: 9,
              background: "#0A84FF", color: "white",
              fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
              boxShadow: "0 2px 12px rgba(10,132,255,0.35)",
            }}
          >
            Ir al Estudio →
          </button>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            style={{
              padding: "7px 16px", borderRadius: 9,
              background: "rgba(255,255,255,0.06)", color: "#aaa",
              fontSize: 13, fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
            }}
          >
            Iniciar sesión
          </button>
        )}
      </header>

      {/* ── Main: centered editor ──────────────────────────────────────────── */}
      <main style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "80px 24px 60px",
      }}>

        {/* Ambient glow */}
        <div style={{
          position: "fixed", top: "35%", left: "50%",
          transform: "translateX(-50%)",
          width: 700, height: 400,
          background: "radial-gradient(ellipse,rgba(10,132,255,0.06) 0%,transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Brand line above box */}
        <p style={{
          fontSize: 13, color: "#2c2c2e", fontWeight: 500,
          letterSpacing: "0.05em", marginBottom: 20, textAlign: "center",
        }}>
          Describe tu idea. La IA produce el video.
        </p>

        {/* ── Creator box ─────────────────────────────────────────────────── */}
        <div style={{
          width: "100%", maxWidth: 780,
          borderRadius: 20,
          background: "#0d1926",
          border: `1px solid ${focused ? "rgba(10,132,255,0.3)" : "rgba(255,255,255,0.06)"}`,
          boxShadow: focused
            ? "0 0 0 3px rgba(10,132,255,0.08), 0 30px 80px rgba(0,0,0,0.6)"
            : "0 30px 80px rgba(0,0,0,0.5)",
          transition: "border-color 0.2s, box-shadow 0.2s",
          position: "relative", overflow: "hidden",
        }}>

          {/* Generating overlay */}
          {generating && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 10,
              background: "rgba(7,16,28,0.94)",
              backdropFilter: "blur(8px)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 16,
            }}>
              <div style={{
                width: 220, height: 2, borderRadius: 99,
                background: "rgba(255,255,255,0.05)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: "60%",
                  background: "linear-gradient(90deg, transparent, #0A84FF, transparent)",
                  animation: "shimmer 1.6s infinite",
                }} />
              </div>
              <p style={{ fontSize: 13, color: "#636366", textAlign: "center", maxWidth: 280 }}>
                {LOADING_MESSAGES[msgIdx]}
              </p>
            </div>
          )}

          {/* Mode pills */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "14px 20px", overflowX: "auto",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            {MODES.map(m => (
              <button key={m.type} onClick={() => setMode(m.type)} style={pill(mode === m.type)}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
            placeholder="Describe tu idea… ej. 'Un detective en el Buenos Aires de 1940 investiga la desaparición de una estrella de tango'"
            rows={5}
            style={{
              width: "100%", background: "transparent", border: "none",
              outline: "none", resize: "none",
              fontSize: 15, lineHeight: 1.7, color: "#e5e5ea",
              padding: "18px 20px", caretColor: "#0A84FF",
              fontFamily: "inherit",
            }}
          />

          {/* Advanced toggle */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <button
              onClick={() => setShowAdv(!showAdv)}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: showAdv ? "#0A84FF" : "#3a3a3c",
                transition: "color 0.18s",
              }}
            >
              <span>Opciones avanzadas — duración, formato, referencia visual</span>
              {showAdv ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showAdv && (
              <div style={{
                padding: "4px 20px 20px",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
              }}>
                {/* Duration */}
                <div>
                  <label style={labelSm}>Duración</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {DURATIONS.map(d => (
                      <button key={d.value} onClick={() => setDuration(d.value)}
                        style={{ ...pill(duration === d.value), padding: "4px 10px", fontSize: 11 }}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect ratio */}
                <div>
                  <label style={labelSm}>Formato</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {ASPECT_RATIOS.map(r => (
                      <button key={r} onClick={() => setAspectRatio(r)}
                        style={{ ...pill(aspectRatio === r), padding: "4px 10px", fontSize: 11 }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reference image */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelSm}>Referencia visual (opcional)</label>
                  {refPreview ? (
                    <div style={{ position: "relative", width: 56, height: 56, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={refPreview} alt="ref" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button onClick={removeRef} style={{
                        position: "absolute", top: 2, right: 2,
                        width: 16, height: 16, borderRadius: "50%",
                        background: "rgba(0,0,0,0.8)", border: "none",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      }}>
                        <X size={8} color="white" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()} style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "7px 12px", borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px dashed rgba(255,255,255,0.08)",
                      color: "#3a3a3c", fontSize: 12, cursor: "pointer",
                    }}>
                      <Upload size={12} /> Subir imagen
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { setRefImage(f); setRefPreview(URL.createObjectURL(f)); }
                    }} />
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            padding: "12px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 12, color: "#2c2c2e" }}>
              {generating
                ? "Procesando…"
                : prompt.length > 0
                  ? `${prompt.length} car.`
                  : "Ctrl + Enter para generar"}
            </span>

            {error && <p style={{ fontSize: 12, color: "#FF453A" }}>{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 22px", borderRadius: 10,
                background: generating || !prompt.trim() ? "rgba(10,132,255,0.2)" : "#0A84FF",
                color: "white", fontSize: 13, fontWeight: 600,
                border: "none",
                cursor: generating || !prompt.trim() ? "not-allowed" : "pointer",
                boxShadow: !generating && prompt.trim() ? "0 4px 16px rgba(10,132,255,0.4)" : "none",
                transition: "all 0.2s",
              }}
            >
              {generating
                ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Creando…</>
                : <><FileVideo size={13} /> Generar</>
              }
            </button>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
