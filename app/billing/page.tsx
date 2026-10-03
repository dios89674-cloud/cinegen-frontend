"use client";


import { useState, useEffect } from "react";
import { Bell, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, type BillingPackage, type SubscriptionPlan } from "@/lib/api";

const CARD_STYLE = {
  background: "linear-gradient(145deg, #0c2034, #091827)",
  border: "1px solid #1b3b59",
  borderRadius: "14px",
  padding: "18px",
};

const BTN_PRIMARY: React.CSSProperties = {
  background: "linear-gradient(135deg, #1680ff, #1763d5)",
  border: "1px solid #368fff",
  color: "white", borderRadius: "10px", padding: "10px 14px",
  cursor: "pointer", fontSize: "13px", fontWeight: 600,
  boxShadow: "0 7px 18px rgba(0,104,255,0.15)",
};

const BTN_GHOST: React.CSSProperties = {
  background: "#0c2034", border: "1px solid #1b3b59",
  color: "#e8f2ff", borderRadius: "10px", padding: "10px 14px",
  cursor: "pointer", fontSize: "13px",
};

const STATIC_PACKAGES: BillingPackage[] = [
  { id: "starter", price_id: "", name: "Starter", credits: 100, price_usd: 9, description: "Para empezar" },
  { id: "creator_pkg", price_id: "", name: "Creator", credits: 500, price_usd: 35, description: "Creadores regulares" },
  { id: "studio_pkg", price_id: "", name: "Studio", credits: 1500, price_usd: 89, description: "Equipos y estudios" },
  { id: "mega", price_id: "", name: "Mega Studio", credits: 5000, price_usd: 249, description: "Producción intensiva" },
];

const STATIC_PLANS: SubscriptionPlan[] = [
  { id: "free", price_id: "", name: "Free", credits_per_month: 0, price_usd_month: 0 },
  { id: "creator", price_id: "", name: "Creator", credits_per_month: 200, price_usd_month: 19 },
  { id: "pro", price_id: "", name: "Pro", credits_per_month: 1000, price_usd_month: 49 },
  { id: "studio", price_id: "", name: "Studio", credits_per_month: 5000, price_usd_month: 149 },
];

function fmtDate(d: Date) {
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function BillingPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [planName, setPlanName] = useState<string>("Free");
  const [packages, setPackages] = useState<BillingPackage[]>(STATIC_PACKAGES);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(STATIC_PLANS);
  const [tab, setTab] = useState<"buy" | "plans">("buy");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!token) return;
    api.getCredits(token).then(r => setBalance(r.balance)).catch(() => {});
    api.getBillingMe(token).then(r => setPlanName(r.plan)).catch(() => {});
    api.getPackages(token).then(pkgs => { if (pkgs?.length) setPackages(pkgs); }).catch(() => {});
    api.getPlans(token).then(pl => { if (pl?.length) setPlans(pl); }).catch(() => {});
  }, [token]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleBuy = async (pkg: BillingPackage) => {
    if (!token) return;
    if (!pkg.price_id) { showToast("Paquete no disponible aún."); return; }
    try {
      const { checkout_url } = await api.checkout(token, pkg.price_id);
      window.open(checkout_url, "_blank");
    } catch { showToast("Error al iniciar el pago."); }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!token) return;
    if (!plan.price_id) { showToast("Plan no disponible aún."); return; }
    try {
      const { checkout_url } = await api.subscribe(token, plan.price_id);
      window.open(checkout_url, "_blank");
    } catch { showToast("Error al iniciar la suscripción."); }
  };

  if (authLoading || !user) return null;

  const today = new Date();
  const d7 = new Date(today); d7.setDate(today.getDate() - 7);
  const d14 = new Date(today); d14.setDate(today.getDate() - 14);

  return (
    <div style={{ minHeight: "100vh", background: "#06111f", color: "#e8f2ff" }}>
      <div style={{ padding: "28px clamp(18px,3vw,42px) 42px" }}>
        {/* Topbar */}
        <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, marginBottom: 28 }}>
          <div>
            <div style={{ color: "#45d6f5", fontSize: 11, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 800, marginBottom: 4 }}>Cuenta</div>
            <h1 style={{ fontSize: "clamp(25px,3vw,34px)", letterSpacing: "-1.2px", margin: "4px 0 5px", fontWeight: 700 }}>Créditos y facturación</h1>
            <p style={{ color: "#91a8c0", margin: 0 }}>Consulta el saldo, el uso y los movimientos de tu cuenta.</p>
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

        {/* 3 stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 22 }}>
          <div style={CARD_STYLE}>
            <div style={{ color: "#91a8c0", fontSize: 12, marginBottom: 4 }}>Saldo de créditos</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "5px 0 12px" }}>
              <span style={{ fontSize: 26, fontWeight: 800 }}>{balance !== null ? balance.toLocaleString("es-DO") : "—"}</span>
              <span style={{ fontSize: 12, color: "#45d6f5", fontWeight: 600 }}>CR</span>
            </div>
            <button style={{ ...BTN_PRIMARY, width: "100%" }} onClick={() => setTab("buy")}>Comprar créditos</button>
          </div>

          <div style={CARD_STYLE}>
            <div style={{ color: "#91a8c0", fontSize: 12, marginBottom: 4 }}>Plan actual</div>
            <h2 style={{ margin: "9px 0 4px", fontSize: 20 }}>{planName} Plan</h2>
            <p style={{ color: "#91a8c0", fontSize: 12, margin: "0 0 14px" }}>Funciones de producción avanzadas.</p>
            <button style={{ ...BTN_GHOST, width: "100%" }} onClick={() => setTab("plans")}>Gestionar suscripción</button>
          </div>

          <div style={CARD_STYLE}>
            <div style={{ color: "#91a8c0", fontSize: 12, marginBottom: 4 }}>Uso del mes</div>
            <h2 style={{ margin: "9px 0 4px", fontSize: 20 }}>— CR</h2>
            <p style={{ color: "#91a8c0", fontSize: 12, margin: "0 0 12px" }}>Créditos utilizados en producción.</p>
            <div style={{ height: 5, background: "#172e44", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "0%", background: "linear-gradient(90deg,#2788ff,#45d6f5)", borderRadius: 99 }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {(["buy", "plans"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ ...BTN_GHOST, ...(tab === t ? { background: "#10385d", borderColor: "#1a5e9e", color: "white" } : {}) }}
            >
              {t === "buy" ? "Comprar créditos" : "Planes de suscripción"}
            </button>
          ))}
        </div>

        {/* Packages */}
        {tab === "buy" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 22 }}>
            {packages.map((pkg) => (
              <div key={pkg.id} style={CARD_STYLE}>
                <span style={{ background: "#123a5e", color: "#73dff8", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>{pkg.name}</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "10px 0 2px" }}>
                  <span style={{ fontSize: 28, fontWeight: 800 }}>{pkg.credits.toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: "#45d6f5" }}>CR</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>${pkg.price_usd} USD</div>
                <p style={{ color: "#91a8c0", fontSize: 11, margin: "0 0 6px" }}>{pkg.description}</p>
                <p style={{ fontSize: 10, color: "#4a6580", margin: "0 0 2px" }}>✓ Sin fecha de expiración</p>
                <p style={{ fontSize: 10, color: "#4a6580", margin: "0 0 14px" }}>✓ Cualquier tipo de producción</p>
                <button style={{ ...BTN_PRIMARY, width: "100%" }} onClick={() => handleBuy(pkg)}>Comprar →</button>
              </div>
            ))}
          </div>
        )}

        {/* Plans */}
        {tab === "plans" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 22 }}>
            {plans.map((plan) => {
              const isPro = plan.name === "Pro";
              return (
                <div key={plan.id} style={{ ...CARD_STYLE, ...(isPro ? { border: "1px solid #2788ff" } : {}) }}>
                  {isPro && (
                    <div style={{ background: "#103d67", color: "#84c6ff", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "3px 8px", display: "inline-block", marginBottom: 8 }}>
                      MÁS POPULAR
                    </div>
                  )}
                  <h3 style={{ margin: "0 0 6px", fontSize: 17 }}>{plan.name}</h3>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "8px 0" }}>
                    <span style={{ fontSize: 26, fontWeight: 800 }}>
                      {plan.price_usd_month === 0 ? "Gratis" : `$${plan.price_usd_month}`}
                    </span>
                    {plan.price_usd_month > 0 && <span style={{ fontSize: 12, color: "#91a8c0" }}>/mes</span>}
                  </div>
                  {plan.credits_per_month > 0 && (
                    <p style={{ fontSize: 12, color: "#45d6f5", margin: "0 0 14px" }}>
                      +{plan.credits_per_month.toLocaleString()} CR/mes incluidos
                    </p>
                  )}
                  <button
                    style={{ ...BTN_PRIMARY, width: "100%", ...(plan.price_usd_month === 0 ? { background: "#0c2034", border: "1px solid #1b3b59", boxShadow: "none" } : {}) }}
                    onClick={() => plan.price_usd_month > 0 ? handleSubscribe(plan) : undefined}
                  >
                    {plan.price_usd_month === 0 ? "Plan actual" : "Suscribirse →"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Historial */}
        <div style={CARD_STYLE}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: "0 0 3px", fontSize: 17 }}>Historial de operaciones</h2>
              <p style={{ color: "#91a8c0", fontSize: 12, margin: 0 }}>Movimientos recientes de tu cuenta.</p>
            </div>
            <button style={BTN_GHOST} onClick={() => showToast("Export no disponible aún.")}>Exportar</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
              <thead>
                <tr>
                  {["Fecha", "Operación", "Créditos", "Estado"].map(h => (
                    <th key={h} style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #173149", color: "#7894ad", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { date: fmtDate(today), op: "Saldo inicial", cr: `+${balance ?? 0}`, crColor: "#29c58b" },
                  { date: fmtDate(d7), op: "Producción", cr: "−250", crColor: "#ff6578" },
                  { date: fmtDate(d14), op: "Compra de créditos", cr: "+500", crColor: "#29c58b" },
                ].map((row, i, arr) => (
                  <tr key={i}>
                    <td style={{ padding: "13px 10px", borderBottom: i < arr.length - 1 ? "1px solid #173149" : "none", color: "#d5e5f4", fontSize: 12 }}>{row.date}</td>
                    <td style={{ padding: "13px 10px", borderBottom: i < arr.length - 1 ? "1px solid #173149" : "none", color: "#d5e5f4", fontSize: 12 }}>{row.op}</td>
                    <td style={{ padding: "13px 10px", borderBottom: i < arr.length - 1 ? "1px solid #173149" : "none", color: row.crColor, fontSize: 12 }}>{row.cr}</td>
                    <td style={{ padding: "13px 10px", borderBottom: i < arr.length - 1 ? "1px solid #173149" : "none", fontSize: 12 }}>
                      <span style={{ background: "#0d4438", color: "#6de3b4", borderRadius: 99, padding: "4px 8px", fontSize: 10, fontWeight: 750 }}>Completado</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 22, right: 22, background: "#103a30", border: "1px solid #23765f", color: "#b4f5dc", padding: "13px 17px", borderRadius: 10, fontSize: 13, zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
