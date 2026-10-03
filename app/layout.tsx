import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "CineGen — Estudio Universal de Contenido con IA",
  description: "Produce films, series, reels, anuncios y documentales con inteligencia artificial.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body
        className="antialiased"
        style={{
          background: "radial-gradient(ellipse at 70% -20%, #12365a 0, transparent 45%), #06111f",
          color: "#e8f2ff",
        }}
      >
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
