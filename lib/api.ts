const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

async function upload<T>(path: string, token: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Upload failed");
  }
  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type FilmStatus =
  | "pending" | "queued" | "generating" | "rendering" | "assembling"
  | "approved" | "ready" | "done" | "failed" | "cancelled"
  | "blocked_insufficient_credits" | "blocked_for_review" | "awaiting_references";

export type PipelineStage =
  | "reference_analysis" | "script" | "casting" | "vfx"
  | "storyboard" | "camera" | "sound" | "editing" | "continuity";

export interface Shot {
  shot_id: string;
  index: number;
  description?: string;
  gs_uri?: string;
  video_url?: string;
  thumbnail_url?: string;
  status?: string;
  duration_seconds?: number;
}

export interface Film {
  id: string;
  film_id?: string;
  prompt?: string;
  premise_text?: string;
  title?: string;
  status: FilmStatus;
  current_stage?: PipelineStage;
  production_type?: string;
  aspect_ratio?: string;
  duration_seconds?: number;
  duration_minutes?: number;
  visual_style?: string;
  genre?: string;
  created_at: string;
  video_url?: string;
  final_gs_uri?: string;
  thumbnail_url?: string;
  thumbnails?: { thumbnails: Array<{ url: string }>; titles: string[] };
  shots?: Shot[];
  elapsed_seconds?: number;
  resolution?: string;
  stages_done?: PipelineStage[];
  completed_stages?: PipelineStage[];
  error?: string;
}

export type EditStatus = "awaiting_clips" | "processing" | "ready" | "failed" | "cancelled" | "blocked_insufficient_credits";

export interface Edit {
  edit_id: string;
  instructions: string;
  status: EditStatus;
  created_at: string;
  final_gs_uri?: string;
  clips?: Array<{ kind: string; description?: string; url?: string }>;
}

export interface DigitalActor {
  actor_id: string;
  name?: string;
  description?: string;
  face_url?: string;
  face_frames?: string[];
  frame_count?: number;
  mode?: "face_swap" | "portrait";
  created_at?: string;
}

export interface CreditBalance {
  balance: number;
}

export interface BillingPackage {
  id: string;
  price_id: string;
  name: string;
  credits: number;
  price_usd: number;
  description?: string;
}

export interface SubscriptionPlan {
  id: string;
  price_id: string;
  name: string;
  credits_per_month: number;
  price_usd_month: number;
  features?: string[];
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  film_id?: string;
  type?: string;
}

export interface ApiKey {
  key_id: string;
  label?: string;
  scopes?: string[];
  created_at: string;
  last_used?: string;
}

export interface Webhook {
  wh_id: string;
  url: string;
  events: string[];
  label?: string;
  created_at: string;
}

export interface BrandKit {
  kit_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface MarketplaceListing {
  listing_id: string;
  kit_id: string;
  name: string;
  description?: string;
  category?: string;
  rating?: number;
  downloads?: number;
  author?: string;
}

// ─── API client ───────────────────────────────────────────────────────────────

export const api = {
  // Films
  scorePremise: (token: string, premise_text: string) =>
    request<{ score: number; tier: string; issues: string[]; suggestions: string[] }>(
      "/films/score-premise", token, { method: "POST", body: JSON.stringify({ premise_text }) }
    ),

  detectType: (token: string, premise_text: string) =>
    request<{ production_type: string; aspect_ratio: string; duration_seconds: number; guidance: string }>(
      "/films/detect-type", token, { method: "POST", body: JSON.stringify({ premise_text }) }
    ),

  createFilm: (token: string, body: {
    premise_text: string; title?: string; genre?: string;
    production_type?: string; aspect_ratio?: string; duration_minutes?: number;
    visual_style?: string; start_immediately?: boolean;
  }) => request<{ film_id: string; film_status: string }>(
    "/films", token, { method: "POST", body: JSON.stringify(body) }
  ),

  listFilms: (token: string, limit = 20, offset = 0) =>
    request<{ films: Film[]; total?: number }>(`/films?limit=${limit}&offset=${offset}`, token)
      .then(r => ({ films: r.films ?? (r as unknown as Film[]), total: r.total ?? 0 })),

  getFilm: (token: string, id: string) =>
    request<Film>(`/films/${id}`, token),

  pollFilm: (token: string, id: string) =>
    request<{ film_status: string; summary: string }>(`/films/${id}/poll`, token, { method: "POST" }),

  cancelFilm: (token: string, id: string) =>
    request<{ film_status: string }>(`/films/${id}/cancel`, token, { method: "POST", body: JSON.stringify({}) }),

  approveContinuity: (token: string, id: string) =>
    request<{ status: string }>(`/films/${id}/continuity/approve`, token, { method: "POST", body: JSON.stringify({ reason: "director approve" }) }),

  deleteFilm: (token: string, id: string) =>
    request<{ deleted: boolean }>(`/films/${id}`, token, { method: "DELETE" }),

  downloadFilm: (token: string, id: string) =>
    request<{ download_url: string }>(`/films/${id}/download`, token),

  estimateFilm: (token: string, id: string) =>
    request<{ estimate: number }>(`/films/${id}/estimate`, token, { method: "POST" }),

  duplicateFilm: (token: string, id: string) =>
    request<{ new_film_id: string }>(`/films/${id}/duplicate`, token, { method: "POST" }),

  upscaleFilm: (token: string, id: string, estimate_only = false) =>
    request<{ estimate?: number; upscale?: object }>(`/films/${id}/upscale`, token, {
      method: "POST", body: JSON.stringify({ estimate_only })
    }),

  generateThumbnails: (token: string, id: string) =>
    request<{ thumbnails: object[] }>(`/films/${id}/thumbnails/generate`, token, {
      method: "POST", body: JSON.stringify({ count: 4, with_titles: true })
    }),

  getThumbnails: (token: string, id: string) =>
    request<{ thumbnails: Array<{ url: string }>; titles: string[] }>(`/films/${id}/thumbnails`, token),

  listDeliveries: (token: string, id: string) =>
    request<{ deliveries: object[]; available_profiles: string[] }>(`/films/${id}/deliveries`, token),

  createDelivery: (token: string, id: string, profile: string) =>
    request<{ download_url: string }>(`/films/${id}/deliveries`, token, {
      method: "POST", body: JSON.stringify({ profile })
    }),

  dubFilm: (token: string, id: string, lang: string, estimate_only = false) =>
    request<{ estimate?: number; dubbing?: object }>(`/films/${id}/dub`, token, {
      method: "POST", body: JSON.stringify({ lang, estimate_only })
    }),

  localizeFilm: (token: string, id: string, lang: string) =>
    request<{ subtitles: object; script: string }>(`/films/${id}/localize`, token, {
      method: "POST", body: JSON.stringify({ lang })
    }),

  transcribeFilm: (token: string, id: string) =>
    request<{ transcript: string; srt: string }>(`/films/${id}/transcribe`, token, { method: "POST", body: JSON.stringify({}) }),

  generateMusic: (token: string, id: string) =>
    request<{ audio_post: object }>(`/films/${id}/music/generate`, token, { method: "POST", body: JSON.stringify({}) }),

  // SSE events
  getEventsUrl: (id: string, token: string) => `${BASE_URL}/films/${id}/events?token=${token}`,

  // Edits
  createEdit: (token: string, instructions: string) =>
    request<{ edit_id: string; edit_status: string }>("/edits", token, {
      method: "POST", body: JSON.stringify({ instructions })
    }),

  listEdits: (token: string) =>
    request<{ edits: Edit[] }>("/edits", token).then(r => r.edits ?? (r as unknown as Edit[])),

  getEdit: (token: string, id: string) =>
    request<Edit>(`/edits/${id}`, token),

  startEdit: (token: string, id: string) =>
    request<{ edit_status: string }>(`/edits/${id}/start`, token, { method: "POST" }),

  downloadEdit: (token: string, id: string) =>
    request<{ download_url: string }>(`/edits/${id}/download`, token),

  deleteEdit: (token: string, id: string) =>
    request<{ deleted: boolean }>(`/edits/${id}`, token, { method: "DELETE" }),

  uploadClip: (token: string, editId: string, file: File, kind: string, description: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    form.append("description", description);
    return upload<{ clip: object }>(`/edits/${editId}/clips`, token, form);
  },

  // Digital actors
  listActors: (token: string) =>
    request<{ digital_actors: DigitalActor[]; count: number }>("/digital-actors", token)
      .then(r => r.digital_actors),

  uploadActor: (token: string, file: File, name: string, description: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("name", name);
    form.append("description", description);
    return upload<DigitalActor>("/digital-actors", token, form);
  },

  deleteActor: (token: string, id: string) =>
    request<{ deleted: boolean }>(`/digital-actors/${id}`, token, { method: "DELETE" }),

  assignActor: (token: string, filmId: string, actor_id: string, character_name: string) =>
    request<{ character_name: string; actor_id: string }>(`/films/${filmId}/digital-actors`, token, {
      method: "POST", body: JSON.stringify({ actor_id, character_name })
    }),

  // Billing
  getCredits: (token: string) =>
    request<CreditBalance>("/users/me/credits", token),

  getBillingMe: (token: string) =>
    request<{ plan: string; credits: number }>("/billing/me", token),

  getPackages: (token: string) =>
    request<{ packages: BillingPackage[] }>("/billing/packages", token).then(r => r.packages),

  getPlans: (token: string) =>
    request<{ plans: SubscriptionPlan[] }>("/billing/subscription-plans", token).then(r => r.plans),

  checkout: (token: string, price_id: string) =>
    request<{ checkout_url: string }>("/billing/checkout", token, {
      method: "POST", body: JSON.stringify({ price_id })
    }),

  subscribe: (token: string, price_id: string) =>
    request<{ checkout_url: string }>("/billing/subscribe", token, {
      method: "POST", body: JSON.stringify({ price_id })
    }),

  // Notifications
  listNotifications: (token: string) =>
    request<{ notifications: Notification[]; unread_count: number }>("/users/me/notifications", token),

  markAllRead: (token: string) =>
    request<{ marked_read: number }>("/users/me/notifications/read-all", token, { method: "POST" }),

  // API Keys
  listApiKeys: (token: string) =>
    request<{ keys: ApiKey[] }>("/api-keys", token).then(r => r.keys),

  createApiKey: (token: string, label: string) =>
    request<{ key: string; key_id: string }>("/api-keys", token, {
      method: "POST", body: JSON.stringify({ label })
    }),

  revokeApiKey: (token: string, key_id: string) =>
    request<{ ok: boolean }>(`/api-keys/${key_id}`, token, { method: "DELETE" }),

  // Webhooks
  listWebhooks: (token: string) =>
    request<{ webhooks: Webhook[] }>("/webhooks", token).then(r => r.webhooks),

  createWebhook: (token: string, url: string, events: string[]) =>
    request<{ wh_id: string; secret: string }>("/webhooks", token, {
      method: "POST", body: JSON.stringify({ url, events })
    }),

  revokeWebhook: (token: string, wh_id: string) =>
    request<{ ok: boolean }>(`/webhooks/${wh_id}`, token, { method: "DELETE" }),

  // Brand kits
  listBrandKits: (token: string) =>
    request<{ kits: BrandKit[] }>("/brand-kits", token).then(r => r.kits),

  createBrandKit: (token: string, body: object) =>
    request<BrandKit>("/brand-kits", token, { method: "POST", body: JSON.stringify(body) }),

  deleteBrandKit: (token: string, kit_id: string) =>
    request<{ ok: boolean }>(`/brand-kits/${kit_id}`, token, { method: "DELETE" }),

  // Marketplace
  listMarketplace: (token: string, category?: string) =>
    request<{ listings: MarketplaceListing[] }>(`/marketplace${category ? `?category=${category}` : ""}`, token)
      .then(r => r.listings),

  downloadListing: (token: string, listing_id: string) =>
    request<{ kit_id: string }>(`/marketplace/${listing_id}/download`, token, { method: "POST" }),

  rateListing: (token: string, listing_id: string, rating: number) =>
    request<object>(`/marketplace/${listing_id}/rate`, token, {
      method: "POST", body: JSON.stringify({ rating })
    }),
};
