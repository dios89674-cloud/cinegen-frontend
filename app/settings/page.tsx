"use client";


import { useState, useEffect, useCallback } from "react";
import { Bell, Search, Copy, Check, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, type ApiKey, type Webhook } from "@/lib/api";

const CARD_STYLE = {
  background: "linear-gradient(145deg, #0c2034, #091827)",
  border: "1px solid #1b3b59",
  borderRadius: "14px",
  padding: "18px",
};

const BTN_PRIMARY: React.CSSProperties = {
  background: "linear-gradient(135deg, #1680ff, #1763d5)",
  border: "1px solid #368fff",
  color: "white", borderRadius: "10px", padding: "10px 18px",
  cursor: "pointer", fontSize: "13px", fontWeight: 600,
  boxShadow: "0 7px 18px rgba(0,104,255,0.15)",
};

const BTN_GHOST: React.CSSProperties = {
  background: "#0c2034", border: "1px solid #1b3b59",
  color: "#e8f2ff", borderRadius: "10px", padding: "8px 12px",
  cursor: "pointer", fontSize: "12px",
};

const BTN_RED: React.CSSProperties = {
  background: "#4c2030", border: "1px solid #7a2b40",
  color: "#ff9eaa", borderRadius: "10px", padding: "8px 12px",
  cursor: "pointer", fontSize: "12px",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", background: "#061523", border: "1px solid #24435f",
  color: "#e8f2ff", borderRadius: "9px", padding: "11px 12px",
  outline: "none", fontSize: "14px",
};

const LOCK_ROW: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  gap: 10, padding: "11px 0", borderBottom: "1px solid #173149", fontSize: 13,
};

const SECTION_HEAD: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  gap: 12, margin: "24px 0 14px",
};

const WEBHOOK_EVENTS = ["film.done", "film.failed", "film.stage.done", "edit.ready", "credits.low"];

export default function SettingsPage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [planName, setPlanName] = useState("Free");
  const [balance, setBalance] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);

  const [notifProduction, setNotifProduction] = useState(true);
  const [notifCredits, setNotifCredits] = useState(true);
  const [confirmBeforeGen, setConfirmBeforeGen] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
    else if (user?.email) setDisplayName(user.email.split("@")[0]);
  }, [user]);

  const loadApiKeys = useCallback(async () => {
    if (!token) return;
    try { setApiKeys(await api.listApiKeys(token)); } catch { /* ignore */ }
  }, [token]);

  const loadWebhooks = useCallback(async () => {
    if (!token) return;
    try { setWebhooks(await api.listWebhooks(token)); } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadApiKeys();
    loadWebhooks();
    api.getBillingMe(token).then(r => setPlanName(r.plan)).catch(() => {});
    api.getCredits(token).then(r => setBalance(r.balance)).catch(() => {});
  }, [token, loadApiKeys, loadWebhooks]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleCreateKey = async () => {
    if (!token || !newKeyLabel.trim()) return;
    try {
      const { key } = await api.createApiKey(token, newKeyLabel.trim());
      setCreatedKey(key);
      setNewKeyLabel("");
      loadApiKeys();
    } catch { showToast("Error al crear la API key."); }
  };

  const handleRevokeKey = async (key_id: string) => {
    if (!token) return;
    try { await api.revokeApiKey(token, key_id); loadApiKeys(); }
    catch { showToast("Error al revocar la clave."); }
  };

  const handleCreateWebhook = async () => {
    if (!token || !newWebhookUrl.trim()) return;
    try {
      const { secret } = await api.createWebhook(token, newWebhookUrl.trim(), WEBHOOK_EVENTS);
      setWebhookSecret(secret);
      setNewWebhookUrl("");
      loadWebhooks();
    } catch { showToast("Error al crear el webhook."); }
  };

  const handleRevokeWebhook = async (wh_id: string) => {
    if (!token) return;
    try { await api.revokeWebhook(token, wh_id); loadWebhooks(); }
    catch { showToast("Error al revocar el webhook."); }
  };

  const handleCopyKey = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (authLoading || !user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#06111f", color: "#e8f2ff" }}>
      <div style={{ padding: "28px clamp(18px,3vw,42px) 42px" }}>
        {/* Topbar */}
        <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, marginBottom: 28 }}>
          <div>
            <div style={{ color: "#45d6f5", fontSize: 11, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 800, marginBottom: 4 }}>Preferencias</div>
            <h1 style={{ fontSize: "clamp(25px,3vw,34px)", letterSpacing: "-1.2px", margin: "4px 0 5px", fontWeight: 700 }}>Configuración</h1>
            <p style={{ color: "#91a8c0", margin: 0 }}>Gestiona tu perfil y las preferencias del workspace.</p>
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

        {/* Split grid */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(270px,1fr)", gap: 16 }}>
          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={CARD_STYLE}>
              <h2 style={{ margin: "0 0 18px", fontSize: 17 }}>Perfil y preferencias</h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                <div style={{ display: "grid", gap: 7 }}>
                  <label style={{ fontSize: 12, color: "#b9cce0", fontWeight: 650 }}>Nombre</label>
                  <input
                    style={INPUT_STYLE}
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                  />
                </div>
                <div style={{ display: "grid", gap: 7 }}>
                  <label style={{ fontSize: 12, color: "#b9cce0", fontWeight: 650 }}>Correo electrónico</label>
                  <input style={{ ...INPUT_STYLE, opacity: 0.7 }} value={user?.email ?? ""} readOnly />
                </div>
              </div>

              <div style={{ display: "grid", gap: 7, marginTop: 13 }}>
                <label style={{ fontSize: 12, color: "#b9cce0", fontWeight: 650 }}>Idioma de interfaz</label>
                <select style={INPUT_STYLE}>
                  <option>Español</option>
                  <option>English</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: 7, margin: "13px 0 18px" }}>
                <label style={{ fontSize: 12, color: "#b9cce0", fontWeight: 650 }}>Zona horaria</label>
                <select style={INPUT_STYLE}>
                  <option>America/Santo_Domingo</option>
                  <option>UTC</option>
                  <option>America/New_York</option>
                  <option>Europe/Madrid</option>
                </select>
              </div>

              <button style={BTN_PRIMARY} onClick={() => showToast("Perfil actualizado correctamente.")}>
                Guardar cambios
              </button>
            </div>

            {/* API Keys */}
            <div style={CARD_STYLE}>
              <div style={SECTION_HEAD}>
                <h2 style={{ margin: 0, fontSize: 16 }}>API Keys</h2>
              </div>

              {apiKeys.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {apiKeys.map(k => (
                    <div key={k.key_id} style={{ ...LOCK_ROW }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{k.label || "Sin nombre"}</div>
                        <div style={{ color: "#4a6580", fontSize: 11 }}>{k.key_id.slice(0, 16)}… · {new Date(k.created_at).toLocaleDateString("es")}</div>
                      </div>
                      <button style={BTN_RED} onClick={() => handleRevokeKey(k.key_id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  style={{ ...INPUT_STYLE, flex: 1 }}
                  placeholder="Label de la nueva key..."
                  value={newKeyLabel}
                  onChange={e => setNewKeyLabel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreateKey()}
                />
                <button style={BTN_PRIMARY} onClick={handleCreateKey}>Crear</button>
              </div>

              {createdKey && (
                <div style={{ marginTop: 12, background: "#061523", border: "1px solid #29c58b", borderRadius: 9, padding: 12 }}>
                  <div style={{ color: "#29c58b", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>✓ Copia esta clave ahora — no la verás de nuevo</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <code style={{ flex: 1, fontSize: 11, color: "#e8f2ff", wordBreak: "break-all" }}>{createdKey}</code>
                    <button style={BTN_GHOST} onClick={handleCopyKey}>
                      {copiedKey ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Webhooks */}
            <div style={CARD_STYLE}>
              <div style={SECTION_HEAD}>
                <h2 style={{ margin: 0, fontSize: 16 }}>Webhooks</h2>
              </div>

              {webhooks.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {webhooks.map(wh => (
                    <div key={wh.wh_id} style={LOCK_ROW}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, wordBreak: "break-all" }}>{wh.url}</div>
                        <div style={{ color: "#4a6580", fontSize: 11 }}>{wh.events.length} eventos</div>
                      </div>
                      <button style={BTN_RED} onClick={() => handleRevokeWebhook(wh.wh_id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  style={{ ...INPUT_STYLE, flex: 1 }}
                  placeholder="https://tu-servidor.com/webhook"
                  value={newWebhookUrl}
                  onChange={e => setNewWebhookUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreateWebhook()}
                />
                <button style={BTN_PRIMARY} onClick={handleCreateWebhook}>Agregar</button>
              </div>

              {webhookSecret && (
                <div style={{ marginTop: 12, background: "#061523", border: "1px solid #29c58b", borderRadius: 9, padding: 12 }}>
                  <div style={{ color: "#29c58b", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>✓ Secreto del webhook (guárdalo):</div>
                  <code style={{ fontSize: 11, color: "#e8f2ff", wordBreak: "break-all" }}>{webhookSecret}</code>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={CARD_STYLE}>
              <h2 style={{ margin: "0 0 16px", fontSize: 17 }}>Preferencias del workspace</h2>

              <div style={LOCK_ROW}>
                <span style={{ color: "#91a8c0" }}>Notificaciones de producción</span>
                <input type="checkbox" checked={notifProduction} onChange={e => setNotifProduction(e.target.checked)} style={{ cursor: "pointer", width: 16, height: 16 }} />
              </div>
              <div style={LOCK_ROW}>
                <span style={{ color: "#91a8c0" }}>Alertas de créditos bajos</span>
                <input type="checkbox" checked={notifCredits} onChange={e => setNotifCredits(e.target.checked)} style={{ cursor: "pointer", width: 16, height: 16 }} />
              </div>
              <div style={{ ...LOCK_ROW, borderBottom: "none" }}>
                <span style={{ color: "#91a8c0" }}>Confirmar antes de generar</span>
                <input type="checkbox" checked={confirmBeforeGen} onChange={e => setConfirmBeforeGen(e.target.checked)} style={{ cursor: "pointer", width: 16, height: 16 }} />
              </div>

              <div style={{ margin: "20px 0 0", borderTop: "1px solid #173149", paddingTop: 16 }}>
                <div style={{ color: "#7894ad", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, marginBottom: 12 }}>Tu cuenta</div>
                <div style={LOCK_ROW}>
                  <span style={{ color: "#91a8c0" }}>Plan actual</span>
                  <span style={{ background: "#103d67", color: "#84c6ff", borderRadius: 99, padding: "3px 8px", fontSize: 10, fontWeight: 700 }}>{planName}</span>
                </div>
                <div style={{ ...LOCK_ROW, borderBottom: "none" }}>
                  <span style={{ color: "#91a8c0" }}>Créditos disponibles</span>
                  <span style={{ color: "#f6b94b", fontWeight: 700 }}>{balance !== null ? balance.toLocaleString() : "—"}</span>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div style={{ ...CARD_STYLE, border: "1px solid #7a2b40", background: "linear-gradient(145deg, #2a0d17, #1a0910)" }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 16, color: "#ff9eaa" }}>Zona de peligro</h2>
              <p style={{ color: "#91a8c0", fontSize: 13, margin: "0 0 16px" }}>
                Para eliminar tu cuenta, contacta con soporte.
              </p>
              <button style={{ ...BTN_RED, padding: "10px 14px", fontSize: 13, width: "100%" }} onClick={logout}>
                Cerrar sesión
              </button>
            </div>
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
