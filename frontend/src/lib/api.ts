// Central API client. All HTTP calls to the backend go through here.
// Base URL is read from VITE_API_BASE_URL (see .env).

import type { Mood, Script, Scene } from "./mockScript";
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

/**
 * The shape returned by PATCH /scripts/:id/regenerate.
 */
export interface RegenerateSectionResponse {
  id: string;
  section: "title" | "tagline" | "scene";
  title: string;
  tagline: string;
  scenes: Scene[];
}

/**
 * The shape returned by POST /scripts/:id/share.
 */
export interface ShareScriptResponse {
  shareToken: string;
  shareUrl: string;
  isPublic: boolean;
  sharedAt: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Backend always responds with { success, message, data, meta? }
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
  return (body?.data !== undefined ? body.data : body) as T;
}

// Normalize a raw Mongoose lean document coming from the backend.
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
  signup: (payload: { name: string; email: string; password: string }) =>
    request<{ email: string; expiresAt: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verifySignupOtp: (email: string, otp: string) =>
    request<AuthResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  resendOtp: (email: string) =>
    request<{ ok: true; message: string }>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => request<{ user: ApiUser }>("/auth/me"),

  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
};

/* ============================================================
 *  FORGOT PASSWORD — 3-phase flow
 * ============================================================ */

export const passwordApi = {
  forgotPassword: (email: string): Promise<{ ok: true; message?: string; devOtp?: string }> =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string): Promise<{ resetToken: string }> =>
    request("/auth/verify-forgot-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

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

  // PATCH /scripts/:id/regenerate
  regenerateSection: (
    id: string,
    section: "title" | "tagline" | "scene",
    sceneNumber?: number,
  ): Promise<RegenerateSectionResponse> =>
    request<RegenerateSectionResponse>(`/scripts/${id}/regenerate`, {
      method: "PATCH",
      body: JSON.stringify({
        section,
        ...(sceneNumber !== undefined ? { sceneNumber } : {}),
      }),
    }),

  /**
   * POST /scripts/:id/share
   * Generates (or retrieves existing) public share link for a script.
   * Idempotent — same token is returned on repeat calls.
   */
  share: (id: string): Promise<ShareScriptResponse> =>
    request<ShareScriptResponse>(`/scripts/${id}/share`, { method: "POST" }),

  /**
   * DELETE /scripts/:id/share
   * Revokes public access to the script (makes it private again).
   */
  unshare: (id: string): Promise<{ id: string; isPublic: boolean }> =>
    request(`/scripts/${id}/share`, { method: "DELETE" }),

  /**
   * GET /scripts/shared/:token
   * Public endpoint — fetches a shared script without authentication.
   */
  getShared: async (token: string): Promise<Script> => {
    if (!API_BASE_URL) throw new ApiError("API base URL not configured", 0);
    const res = await fetch(`${API_BASE_URL}/scripts/shared/${token}`, {
      headers: { "Content-Type": "application/json" },
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw new ApiError(body?.message || res.statusText || "Request failed", res.status);
    }
    return (body?.data !== undefined ? body.data : body) as Script;
  },
};
