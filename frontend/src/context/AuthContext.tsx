import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { authApi, tokenStore, type ApiUser } from "@/lib/api";

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  justLoggedIn: boolean; // NEW: true for one render cycle after login
  consumeJustLoggedIn: () => void; // NEW: call once to clear the flag
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<{ email: string }>;
  loginWithCredentials: (token: string, user: ApiUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false); // NEW

  // On mount: rehydrate from existing token — this is NOT a fresh login,
  // so we deliberately do NOT set justLoggedIn here.
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // Standard login — stores token, sets user, marks as just logged in.
  async function login(email: string, password: string) {
    const res = await authApi.login({ email, password });
    tokenStore.set(res.token);
    setUser(res.user);
    setJustLoggedIn(true); // NEW
  }

  // Signup initiates OTP flow only — no token yet.
  async function signup(name: string, email: string, password: string) {
    const res = await authApi.signup({ name, email, password });
    try {
      localStorage.setItem("cinescript_pending_email", res.email);
    } catch {}
    return res;
  }

  // Called by OtpVerification after successful OTP — also marks fresh login.
  function loginWithCredentials(token: string, user: ApiUser) {
    tokenStore.set(token);
    setUser(user);
    setJustLoggedIn(true); // NEW: signup completion also gets a welcome
  }

  function logout() {
    authApi.logout().catch(() => {});
    tokenStore.clear();
    setUser(null);
  }

  // Consume the flag — index.tsx calls this after showing the welcome modal
  // so it never fires again on subsequent renders.
  function consumeJustLoggedIn() {
    setJustLoggedIn(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        justLoggedIn,
        consumeJustLoggedIn,
        login,
        signup,
        loginWithCredentials,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
