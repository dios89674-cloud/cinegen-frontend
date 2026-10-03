"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Upload, ArrowRight, Search, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const PROD_MODES: { value: string; label: string }[] = [
  { value: "SHORT_FILM",        label: "Cortometraje" },
  { value: "FEATURE_FILM",      label: "Largometraje" },
  { value: "FEATURE_FILM_FULL", label: "Película completa" },
  { value: "TRAILER",           label: "Tráiler" },
  { value: "TV_SERIES",         label: "Serie de TV" },
  { value: "MINISERIES",        label: "Miniserie" },
  { value: "NOVELA",            label: "Telenovela" },
  { value: "ANTHOLOGY",         label: "Antología" },
  { value: "SOCIAL_SHORT",      label: "Short / Reel" },
  { value: "MUSIC_VIDEO",       label: "Videoclip musical" },
  { value: "YOUTUBE_LONG",      label: "YouTube (largo)" },
  { value: "ADVERTISEMENT",     label: "Anuncio publicitario" },
  { value: "BRAND_FILM",        label: "Brand Film" },
  { value: "PRODUCT_VIDEO",     label: "Vídeo de producto" },
  { value: "CORPORATE_VIDEO",   label: "Vídeo corporativo" },
  { value: "EXPLAINER",         label: "Explainer" },
  { value: "PODCAST_VIDEO",     label: "Videopodcast" },
  { value: "NEWS_REPORT",       label: "Reportaje / Noticias" },
  { value: "TRAINING_VIDEO",    label: "Formación / Tutorial" },
  { value: "DOCUMENTARY",       label: "Documental" },
  { value: "EVENT_HIGHLIGHT",   label: "Evento / Highlight" },
  { value: "SPORTS_HIGHLIGHT",  label: "Deportes / Resumen" },
  { value: "TESTIMONIAL",       label: "Testimonial" },
];

const DURATION_CREDITS: Record<string, number> = {
  "1": 35, "3": 110, "5": 190, "12": 420, "30": 980, "60": 1850, "90": 2600,
};

const STEPS = ["Idea", "Configuración", "Referencias", "Confirmación"];

const CARD: React.CSSProperties = {
  background: "linear-gradient(145deg, #0c2034, #091827)",
  border: "1px solid #1b3b59",
  borderRadius: 14,
  padding: 24,
};

const FIELD_INPUT: React.CSSProperties = {
  width: "100%",
  background: "#061523",
  border: "1px solid #24435f",
  color: "#e8f2ff",
  borderRadius: 9,
  padding: "11px 13px",
  outline: "none",
  fontSize: 14,
  fontFamily: "inherit",
};

const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#b9cce0",
  fontWeight: 650,
  marginBottom: 7,
};

export default function NewFilmPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [premise, setPremise]     = useState("");
  const [notes, setNotes]         = useState("");
  const [prodType, setProdType]   = useState(searchParams.get("type") ?? "SHORT_FILM");
  const [duration, setDuration]   = useState("12");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [quality, setQuality]     = useState("balanced");
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [dragging, setDragging]   = useState(false);

  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected]   = useState<string | null>(null);
  const [scoring, setScoring]     = useState(false);
  const [scoreResult, setScoreResult] = useState<{ score: number; tier: string; suggestions: string[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]          = useState("");

  const detectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  const handlePremiseChange = useCallback((text: string) => {
    setPremise(text);
    setDetected(null);
    if (detectTimer.current) clearTimeout(detectTimer.current);
    if (!text.trim() || !token) return;
    detectTimer.current = setTimeout(async () => {
      setDetecting(true);
      try {
        const res = await api.detectType(token, text);
        setProdType(res.production_type);
        setDetected(res.production_type);
        if (res.duration_seconds) {
          const mins = Math.round(res.duration_seconds / 60);
          const closest = ["1", "3", "5", "12", "30", "60", "90"].reduce((a, b) =>
            Math.abs(Number(b) - mins) < Math.abs(Number(a) - mins) ? b : a
          );
          setDuration(closest);
        }
      } catch { /* silent */ }
      finally { setDetecting(false); }
    }, 800);
  }, [token]);

  const handleScore = async () => {
    if (!premise.trim() || !token) return;
    setScoring(true);
    setScoreResult(null);
    try {
      const res = await api.scorePremise(token, premise);
      setScoreResult(res);
    } catch { /* silent */ }
    finally { setScoring(false); }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setFileNames(Array.from(files).map(f => f.name));
  };

  const handleSubmit = async () => {
    if (!premise.trim() || !token) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.createFilm(token, {
        premise_text: premise,
        production_type: prodType,
        aspect_ratio: aspectRatio,
        duration_minutes: Number(duration),
        start_immediately: true,
      });
      router.push(`/films/${res.film_id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear el proyecto");
      setSubmitting(false);
    }
  };

  const detectedLabel = detected
    ? PROD_MODES.find(m => m.value === detected)?.label
    : null;
  const credits = DURATION_CREDITS[duration] ?? 420;

  if (authLoading || !user) return null;

  return (
    <div style={{ color: "#e8f2ff", minHeight: "100vh" }}>
      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, padding: "28px clamp(18px,3vw,42px) 0" }}>
        <div>
          <p style={{ color: "#45d6f5", fontSize: 11, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 800, margin: 0 }}>Nuevo proyecto</p>
          <h1 style={{ fontSize: "clamp(24px,3vw,34px)", letterSpacing: "-1.2px", margin: "4px 0 5px", fontWeight: 700 }}>Crea tu próximo contenido.</h1>
          <p style={{ color: "#91a8c0", margin: 0, fontSize: 14 }}>Define la idea, configura la producción y revisa el coste estimado.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4a6580" }} />
            <input placeholder="Buscar proyectos..." style={{ ...FIELD_INPUT, width: 200, paddingLeft: 34 }} />
          </div>
          <button style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #1b3b59", background: "#0c2034", color: "#91a8c0", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <Bell size={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: "20px clamp(18px,3vw,42px) 42px" }}>
        {/* Step indicators */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              display: "flex", alignItems: "center", gap: 8, fontSize: 12,
              padding: "8px 12px", borderRadius: 9,
              background: i === 0 ? "#10385d" : "#0a1a2b",
              color: i === 0 ? "white" : "#91a8c0",
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center",
                fontSize: 11, fontWeight: 700,
                background: i === 0 ? "#2788ff" : "#19334d",
                color: i === 0 ? "white" : "#b9d4ed",
              }}>{i + 1}</span>
              {s}
            </div>
          ))}
        </div>

        {/* Split grid */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(270px,1fr)", gap: 16, alignItems: "start" }}>

          {/* LEFT — Idea */}
          <div style={CARD}>
            <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700 }}>Cuéntanos tu idea</h2>
            <p style={{ color: "#91a8c0", fontSize: 12, margin: "0 0 20px" }}>Una buena premisa es el primer paso para una gran producción.</p>

            {/* Premise */}
            <div style={{ marginBottom: 17 }}>
              <label style={LABEL}>Premisa del contenido</label>
              <textarea
                value={premise}
                onChange={e => handlePremiseChange(e.target.value)}
                placeholder="Ej.: En una ciudad futurista, una detective descubre que los recuerdos de la población están siendo manipulados..."
                rows={5}
                style={{ ...FIELD_INPUT, minHeight: 130, resize: "vertical" }}
              />
              {detecting && <p style={{ color: "#45d6f5", fontSize: 11, marginTop: 4, marginBottom: 0 }}>Detectando tipo…</p>}
              {detectedLabel && !detecting && (
                <p style={{ marginTop: 6, fontSize: 12, marginBottom: 0 }}>
                  Detectado: <span style={{ color: "#45d6f5", fontWeight: 700 }}>{detectedLabel}</span> — aplicado
                </p>
              )}
            </div>

            {/* Analyze */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: scoreResult ? 0 : 20 }}>
              <button
                onClick={handleScore}
                disabled={!premise.trim() || scoring}
                style={{
                  border: "1px solid #1b3b59", background: "#0c2034", color: "#e8f2ff",
                  borderRadius: 10, padding: "9px 14px", fontSize: 13,
                  cursor: premise.trim() && !scoring ? "pointer" : "not-allowed",
                  opacity: premise.trim() ? 1 : 0.5, fontFamily: "inherit",
                }}
              >
                {scoring ? "Analizando…" : "✦ Analizar idea"}
              </button>
              <span style={{ color: "#91a8c0", fontSize: 12 }}>Analiza género, tono y potencial visual.</span>
            </div>

            {scoreResult && (
              <div style={{ background: "#0d2337", border: "1px solid #234967", borderRadius: 12, padding: 14, marginBottom: 18, marginTop: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: scoreResult.score >= 7 ? "#29c58b" : scoreResult.score >= 4 ? "#f6b94b" : "#ff6578" }}>
                    {scoreResult.score}/10
                  </span>
                  <span style={{ fontSize: 12, color: "#91a8c0" }}>{scoreResult.tier}</span>
                </div>
                {scoreResult.suggestions.length > 0 && (
                  <ul style={{ margin: 0, padding: "0 0 0 16px", color: "#91a8c0", fontSize: 12 }}>
                    {scoreResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                )}
              </div>
            )}

            {/* References upload */}
            <div style={{ marginBottom: 17, marginTop: scoreResult ? 0 : 0 }}>
              <label style={LABEL}>Referencias visuales (opcional)</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                style={{
                  border: `1px dashed ${dragging ? "#2788ff" : "#3574a1"}`,
                  borderRadius: 12, textAlign: "center", padding: 24,
                  color: "#91a8c0", background: dragging ? "#0c2b44" : "#071a2b",
                  transition: "background 0.15s",
                }}
              >
                <Upload size={24} style={{ margin: "0 auto 8px", display: "block", color: "#4a6580" }} />
                <strong style={{ display: "block", color: "#d7e9fa", marginBottom: 4, fontSize: 13 }}>Arrastra imágenes aquí o selecciona archivos</strong>
                <small style={{ fontSize: 12 }}>Imágenes de estilo, personajes o localizaciones</small>
                <label style={{ display: "inline-block", marginTop: 12, border: "1px solid #1b3b59", background: "#0c2034", color: "#e8f2ff", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer" }}>
                  Seleccionar imágenes
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
                </label>
                {fileNames.length > 0 && (
                  <p style={{ marginTop: 8, fontSize: 11, color: "#45d6f5", marginBottom: 0 }}>{fileNames.join(" · ")}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={LABEL}>Notas adicionales (opcional)</label>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Tono, audiencia, restricciones creativas..."
                style={FIELD_INPUT}
              />
            </div>
          </div>

          {/* RIGHT — Configuración */}
          <div style={CARD}>
            <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700 }}>Configuración</h2>

            <div style={{ marginBottom: 17 }}>
              <label style={LABEL}>Modo de producción</label>
              <select value={prodType} onChange={e => setProdType(e.target.value)} style={FIELD_INPUT}>
                {PROD_MODES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13, marginBottom: 17 }}>
              <div>
                <label style={LABEL}>Duración objetivo</label>
                <select value={duration} onChange={e => setDuration(e.target.value)} style={FIELD_INPUT}>
                  <option value="1">1 minuto</option>
                  <option value="3">3 minutos</option>
                  <option value="5">5 minutos</option>
                  <option value="12">12 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="60">60 minutos</option>
                  <option value="90">90 minutos</option>
                </select>
              </div>
              <div>
                <label style={LABEL}>Relación de aspecto</label>
                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} style={FIELD_INPUT}>
                  <option value="16:9">16:9 — Estándar</option>
                  <option value="2.39:1">2.39:1 — Cine</option>
                  <option value="9:16">9:16 — Vertical</option>
                  <option value="1:1">1:1 — Cuadrado</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 17 }}>
              <label style={LABEL}>Calidad objetivo</label>
              <select value={quality} onChange={e => setQuality(e.target.value)} style={FIELD_INPUT}>
                <option value="balanced">Equilibrada</option>
                <option value="high">Alta — más recursos</option>
                <option value="draft">Borrador — rápida</option>
              </select>
            </div>

            {/* Credit estimate */}
            <div style={{ background: "#0d2337", border: "1px solid #234967", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <span style={{ color: "#91a8c0", fontSize: 12 }}>Estimación de créditos</span>
              <strong style={{ display: "block", fontSize: 26, letterSpacing: "-0.5px", margin: "5px 0 4px" }}>
                {credits.toLocaleString("es-DO")} <span style={{ fontSize: 13, color: "#45d6f5", fontWeight: 400 }}>CR</span>
              </strong>
              <span style={{ color: "#91a8c0", fontSize: 11 }}>Estimación de referencia. La real se confirma al iniciar.</span>
            </div>

            {error && (
              <div style={{ background: "#4c2030", border: "1px solid #7a3040", borderRadius: 9, padding: "10px 13px", color: "#ff9eaa", fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSubmit}
                disabled={!premise.trim() || submitting}
                style={{
                  background: premise.trim() && !submitting
                    ? "linear-gradient(135deg, #1680ff, #1763d5)"
                    : "#1b3b59",
                  border: "1px solid #368fff",
                  boxShadow: premise.trim() && !submitting ? "0 7px 18px #0068ff25" : "none",
                  color: "white", borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 600,
                  cursor: premise.trim() && !submitting ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {submitting ? "Iniciando…" : <><span>Iniciar producción</span> <ArrowRight size={15} /></>}
              </button>
            </div>

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #1b3b59" }}>
              <p style={{ color: "#4a6580", fontSize: 11, margin: 0 }}>
                ¿Buscas un formato concreto?{" "}
                <Link href="/content" style={{ color: "#2788ff", textDecoration: "none" }}>Explorar tipos de contenido →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`select option { background: #061523; color: #e8f2ff; }`}</style>
    </div>
  );
}
