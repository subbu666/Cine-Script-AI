// Central API client. All HTTP calls to the backend go through here.
// Base URL is read from VITE_API_BASE_URL (see .env).

import type { Mood, Script } from "./mockScript";
import { generateMockScript } from "./mockScript";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

const TOKEN_KEY = "cinescript-token";

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {}
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

export interface ApiUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Backend always responds with { success, message, data, meta? }
// This function unwraps the envelope so callers receive `data` directly.
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) throw new ApiError("API base URL not configured", 0);
  const token = tokenStore.get();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(body?.message || res.statusText || "Request failed", res.status);
  }
  // Unwrap ApiResponse envelope: { success, message, data } → data
  return (body?.data !== undefined ? body.data : body) as T;
}

// Normalize a raw Mongoose lean document coming from the backend.
// .lean() skips virtuals so documents arrive with _id (ObjectId string)
// but no `id`. We remap _id → id so the frontend Script type is satisfied.
function normalizeScript(raw: Record<string, unknown>): Script {
  return {
    ...(raw as unknown as Script),
    id: String(raw._id ?? raw.id),
  };
}

/* ============================================================
 *  AUTH ENDPOINTS
 * ============================================================ */

export const authApi = {
  // POST /auth/signup { name, email, password }
  signup: (payload: { name: string; email: string; password: string }) =>
    request<{ email: string; expiresAt: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // POST /auth/verify-otp { email, otp } → { token, user }
  verifySignupOtp: (email: string, otp: string) =>
    request<AuthResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  // POST /auth/resend-otp { email }
  resendOtp: (email: string) =>
    request<{ ok: true; message: string }>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // POST /auth/login { email, password } → { token, user }
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // GET /auth/me → { user }
  me: () => request<{ user: ApiUser }>("/auth/me"),

  // POST /auth/logout
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
};

/* ============================================================
 *  FORGOT PASSWORD — 3-phase flow
 *
 *  Phase 1  POST /auth/forgot-password      { email }
 *           → { ok: true }
 *           (backend sends OTP email; devOtp only present in dev mode)
 *
 *  Phase 2  POST /auth/verify-forgot-otp   { email, otp }
 *           → { resetToken: string }
 *
 *  Phase 3  POST /auth/reset-password      { resetToken, password }
 *           → { ok: true }
 * ============================================================ */

export const passwordApi = {
  /**
   * Phase 1 — request a password-reset OTP.
   * The backend always returns 200 (to prevent account enumeration).
   * In development mode the response may include `devOtp` for testing.
   */
  forgotPassword: (email: string): Promise<{ ok: true; message?: string; devOtp?: string }> =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  /**
   * Phase 2 — verify the OTP.
   * On success the backend returns a short-lived `resetToken` (JWT, 10 min).
   */
  verifyOtp: (email: string, otp: string): Promise<{ resetToken: string }> =>
    request("/auth/verify-forgot-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  /**
   * Phase 3 — set the new password.
   * The `resetToken` from Phase 2 must be included.
   */
  resetPassword: (resetToken: string, password: string): Promise<{ ok: true }> =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ resetToken, password }),
    }),
};

/* ============================================================
 *  SCRIPT ENDPOINTS
 * ============================================================ */

export const scriptApi = {
  // POST /scripts/generate { situation, mood } → Script
  generate: async (situation: string, mood: Mood): Promise<Script> => {
    if (!API_BASE_URL) {
      await new Promise((r) => setTimeout(r, 800));
      return generateMockScript(situation, mood);
    }
    try {
      return await request<Script>("/scripts/generate", {
        method: "POST",
        body: JSON.stringify({ situation, mood }),
      });
    } catch {
      return generateMockScript(situation, mood);
    }
  },

  // GET /scripts/history → Script[]
  list: async (): Promise<Script[]> => {
    const raw = await request<Record<string, unknown>[]>("/scripts/history");
    return raw.map(normalizeScript);
  },

  // GET /scripts/:id → Script
  get: (id: string) => request<Script>(`/scripts/${id}`),

  // PATCH /scripts/:id/favorite → { id, isFavorite }
  toggleFavorite: (id: string) =>
    request<{ id: string; isFavorite: boolean }>(`/scripts/${id}/favorite`, {
      method: "PATCH",
    }),

  // DELETE /scripts/:id
  remove: (id: string) => request<{ ok: true }>(`/scripts/${id}`, { method: "DELETE" }),

  // GET /scripts/stats
  stats: () =>
    request<{
      totalScripts: number;
      favoriteScripts: number;
      averageScenesPerScript: number;
      moodsExplored: number;
      moodBreakdown: { mood: string; count: number }[];
    }>("/scripts/stats"),
};
