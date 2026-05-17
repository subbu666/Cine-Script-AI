import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clapperboard, Mail, KeyRound, Lock, Check, ArrowLeft } from "lucide-react";
import { passwordApi } from "@/lib/api";
import { PasswordStrength, isPasswordAcceptable } from "@/components/PasswordStrength";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({ meta: [{ title: "Reset password · CineScript" }] }),
});

type Phase = 1 | 2 | 3 | 4;

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>(1);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>();

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient shadow-gold">
            <Clapperboard className="h-5 w-5 text-black" />
          </div>
          <span className="font-display text-2xl font-semibold">CineScript</span>
        </Link>

        <Stepper phase={phase} />

        <div className="mt-6 overflow-hidden rounded-3xl glass p-8 shadow-gold-sm">
          <AnimatePresence mode="wait">
            {phase === 1 && (
              <PhaseShell key="1">
                <EmailPhase
                  onDone={(em, otp) => {
                    setEmail(em);
                    setDevOtp(otp);
                    setPhase(2);
                  }}
                />
              </PhaseShell>
            )}
            {phase === 2 && (
              <PhaseShell key="2">
                <OtpPhase
                  email={email}
                  devOtp={devOtp}
                  onResend={async () => {
                    const r = await passwordApi.forgotPassword(email);
                    setDevOtp(r.devOtp);
                  }}
                  onBack={() => setPhase(1)}
                  onVerified={(token) => {
                    setResetToken(token);
                    setPhase(3);
                  }}
                />
              </PhaseShell>
            )}
            {phase === 3 && (
              <PhaseShell key="3">
                <NewPasswordPhase
                  resetToken={resetToken}
                  onDone={() => setPhase(4)}
                />
              </PhaseShell>
            )}
            {phase === 4 && (
              <PhaseShell key="4">
                <SuccessPhase onContinue={() => navigate({ to: "/login" })} />
              </PhaseShell>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link to="/login" className="text-gold hover:underline">Back to sign in</Link>
        </p>
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
        .otp-input {
          width: 100%;
          height: 56px;
          text-align: center;
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 600;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.75rem;
          color: var(--color-foreground);
          transition: all .2s ease;
        }
        .otp-input:focus {
          outline: none;
          border-color: rgba(212,175,55,0.6);
          box-shadow: 0 0 0 4px rgba(212,175,55,0.12);
        }
        .otp-input.filled { border-color: rgba(212,175,55,0.35); color: var(--color-gold); }
      `}</style>
    </div>
  );
}

function PhaseShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

function Stepper({ phase }: { phase: Phase }) {
  const steps = [
    { icon: Mail, label: "Email" },
    { icon: KeyRound, label: "Verify" },
    { icon: Lock, label: "New password" },
  ];
  const active = Math.min(phase, 3);
  return (
    <div className="flex items-center justify-between gap-2 px-2">
      {steps.map((s, i) => {
        const idx = i + 1;
        const done = idx < active || phase === 4;
        const current = idx === active && phase !== 4;
        const Icon = done ? Check : s.icon;
        return (
          <div key={s.label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-500 ${
                  done
                    ? "border-gold bg-gold-gradient text-black shadow-gold-sm"
                    : current
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-white/10 bg-white/5 text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className={`mt-1.5 text-[10px] uppercase tracking-wider ${current || done ? "text-gold" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="mx-2 mt-[-18px] h-px flex-1 bg-white/10">
                <div
                  className="h-px bg-gold-gradient transition-all duration-500"
                  style={{ width: idx < active || phase === 4 ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- PHASE 1 ---------- */
function EmailPhase({ onDone }: { onDone: (email: string, devOtp?: string) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await passwordApi.forgotPassword(email);
      onDone(email, res.devOtp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 className="font-display text-3xl font-semibold">Forgot your password?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the email on your account and we'll send a 6-digit verification code.
      </p>
      <div className="mt-6">
        <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-gold">Email</label>
        <input
          required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com" className="auth-input"
        />
      </div>
      {error && <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
      <SubmitButton loading={loading} label="Send verification code" />
    </form>
  );
}

/* ---------- PHASE 2 ---------- */
function OtpPhase({
  email, devOtp, onResend, onBack, onVerified,
}: {
  email: string;
  devOtp?: string;
  onResend: () => Promise<void>;
  onBack: () => void;
  onVerified: (token: string) => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(30);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, "").slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = clean;
      return next;
    });
    if (clean && i < 5) inputs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputs.current[i + 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const arr = Array(6).fill("");
    text.split("").forEach((c, i) => (arr[i] = c));
    setDigits(arr);
    inputs.current[Math.min(text.length, 5)]?.focus();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < 6) { setError("Enter all 6 digits"); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await passwordApi.verifyOtp(email, otp);
      onVerified(res.resetToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (cooldown > 0) return;
    await onResend();
    setCooldown(30);
  }

  return (
    <form onSubmit={submit}>
      <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-gold">
        <ArrowLeft className="h-3 w-3" /> Change email
      </button>
      <h1 className="font-display text-3xl font-semibold">Check your inbox</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a 6-digit code to <span className="text-foreground">{email}</span>.
      </p>
      {devOtp && (
        <p className="mt-3 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-xs text-gold">
          Dev mode · OTP: <span className="font-mono font-semibold">{devOtp}</span>
        </p>
      )}
      <div className="mt-6 grid grid-cols-6 gap-2" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            className={`otp-input ${d ? "filled" : ""}`}
          />
        ))}
      </div>
      {error && <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
      <SubmitButton loading={loading} label="Verify code" />
      <div className="mt-3 text-center text-xs text-muted-foreground">
        Didn't get it?{" "}
        <button
          type="button" onClick={resend} disabled={cooldown > 0}
          className="text-gold transition hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}

/* ---------- PHASE 3 ---------- */
function NewPasswordPhase({ resetToken, onDone }: { resetToken: string; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isPasswordAcceptable(password)) { setError("Please choose a stronger password."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      await passwordApi.resetPassword(resetToken, password);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 className="font-display text-3xl font-semibold">Set a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">Make it memorable, but make it strong.</p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-gold">New password</label>
          <input
            required type="password" minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" className="auth-input"
          />
          <PasswordStrength password={password} />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-gold">Confirm password</label>
          <input
            required type="password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••" className="auth-input"
          />
        </div>
      </div>
      {error && <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
      <SubmitButton loading={loading} label="Reset password" />
    </form>
  );
}

/* ---------- PHASE 4 ---------- */
function SuccessPhase({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 14, stiffness: 200 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient text-black shadow-gold"
      >
        <Check className="h-7 w-7" strokeWidth={3} />
      </motion.div>
      <h1 className="mt-5 font-display text-3xl font-semibold">All set</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your password has been updated. Time to write your next blockbuster.</p>
      <button
        onClick={onContinue}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gold-gradient py-3 text-sm font-semibold text-black shadow-gold transition hover:scale-[1.02]"
      >
        Continue to sign in
      </button>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit" disabled={loading}
      className="group relative mt-5 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gold-gradient py-3 text-sm font-semibold text-black shadow-gold transition disabled:opacity-50"
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          Please wait…
        </>
      ) : label}
    </button>
  );
}
