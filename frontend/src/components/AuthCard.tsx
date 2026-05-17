import { useState, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Clapperboard } from "lucide-react";
import { PasswordStrength, isPasswordAcceptable } from "./PasswordStrength";

interface Props {
  mode: "login" | "signup";
  onSubmit: (values: { name?: string; email: string; password: string }) => Promise<void>;
  footer: ReactNode;
}

export function AuthCard({ mode, onSubmit, footer }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && !isPasswordAcceptable(password)) {
      setError("Please choose a stronger password.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ name, email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient shadow-gold">
            <Clapperboard className="h-5 w-5 text-black" />
          </div>
          <span className="font-display text-2xl font-semibold">CineScript</span>
        </Link>

        <div className="rounded-3xl glass p-8 shadow-gold-sm">
          <h1 className="font-display text-3xl font-semibold text-foreground">
            {isSignup ? "Join the studio" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup ? "Create your director's pass." : "Sign in to continue writing blockbusters."}
          </p>

          <form onSubmit={handle} className="mt-6 space-y-4">
            {isSignup && (
              <Field label="Name">
                <input
                  required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Karan Johar"
                  className="auth-input"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                className="auth-input"
              />
            </Field>
            <Field label="Password">
              <input
                required type="password" minLength={isSignup ? 8 : 6}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input"
              />
              {isSignup && <PasswordStrength password={password} />}
            </Field>
            {!isSignup && (
              <div className="-mt-2 text-right">
                <Link to="/forgot-password" className="text-[11px] text-muted-foreground transition hover:text-gold">
                  Forgot password?
                </Link>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gold-gradient py-3 text-sm font-semibold text-black shadow-gold transition disabled:opacity-50"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Please wait…
                </>
              ) : (
                isSignup ? "Create account" : "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </motion.div>

      <style>{`
        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: var(--color-foreground);
          transition: all .25s ease;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.3); }
        .auth-input:focus {
          outline: none;
          border-color: rgba(212,175,55,0.5);
          box-shadow: 0 0 0 4px rgba(212,175,55,0.1);
          background: rgba(255,255,255,0.06);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-gold">{label}</span>
      {children}
    </label>
  );
}
