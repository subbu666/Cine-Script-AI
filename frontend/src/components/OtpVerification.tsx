/**
 * OtpVerification.tsx
 * ────────────────────
 * Drop-in OTP verification screen for CineScript.
 * Matches the AuthCard luxury black + gold theme exactly.
 *
 * Integration:
 *   1. After signup succeeds, navigate to "/verify-otp" and pass
 *      the user's email via router state or localStorage.
 *   2. On success, navigate to the app dashboard and store the JWT.
 *
 * Usage:
 *   <OtpVerification email="user@studio.com" onVerified={(token) => { … }} />
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import { Clapperboard, Film, CheckCircle2 } from "lucide-react";
import { authApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  /** Email displayed in the subtitle and sent to the API */
  email?: string;
  /** Called with the JWT after successful verification */
  onVerified?: (token: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 30;

// ─── Component ───────────────────────────────────────────────────────────────

export function OtpVerification({ email, onVerified }: Props) {
  const navigate = useNavigate();
  const { loginWithCredentials } = useAuth();

  // Resolve email from prop → localStorage → fallback
  const resolvedEmail =
    email ??
    (typeof localStorage !== "undefined"
      ? (localStorage.getItem("cinescript_pending_email") ?? "")
      : "");

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [resending, setResending] = useState(false);
  const [shake, setShake] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-start countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ── Digit helpers ──────────────────────────────────────────────────────────

  const updateDigit = (index: number, value: string) => {
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setStatus("idle");
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        updateDigit(index, "");
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        updateDigit(index - 1, "");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!text) return;
    const next = Array(OTP_LENGTH).fill("");
    text.split("").forEach((ch, i) => (next[i] = ch));
    setDigits(next);
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  // ── Verify ─────────────────────────────────────────────────────────────────

  const otp = digits.join("");
  const canVerify = otp.length === OTP_LENGTH && !loading && status !== "success";

  const handleVerify = useCallback(async () => {
    if (!canVerify) return;
    setLoading(true);
    setStatus("idle");
    try {
      // verifySignupOtp hits POST /auth/verify-otp and returns { token, user }
      const res = await authApi.verifySignupOtp(resolvedEmail, otp);

      // Persist token + update auth context so the app knows the user is logged in
      loginWithCredentials(res.token, res.user);

      // Clean up the pending email stored during signup
      try {
        localStorage.removeItem("cinescript_pending_email");
      } catch {}

      setStatus("success");
      setTimeout(() => {
        onVerified?.(res.token);
        navigate({ to: "/" });
      }, 1800);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Invalid OTP. Please try again.";
      setErrorMsg(msg);
      setStatus("error");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  }, [canVerify, otp, resolvedEmail, onVerified, navigate, loginWithCredentials]);

  // Allow submitting with Enter
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter") handleVerify();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleVerify]);

  // ── Resend ─────────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setStatus("idle");
    setDigits(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
    try {
      await authApi.resendOtp(resolvedEmail);
      setCountdown(RESEND_COUNTDOWN);
    } finally {
      setResending(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12 overflow-hidden">
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(212,175,55,0.08) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient shadow-gold">
            <Clapperboard className="h-5 w-5 text-black" />
          </div>
          <span className="font-display text-2xl font-semibold">CineScript</span>
        </Link>

        {/* ── Glass card ── */}
        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl glass p-8 shadow-gold-sm"
          style={{
            boxShadow:
              status === "error"
                ? "0 0 0 1px rgba(239,68,68,0.35), 0 0 24px rgba(239,68,68,0.12)"
                : status === "success"
                  ? "0 0 0 1px rgba(212,175,55,0.5), 0 0 32px rgba(212,175,55,0.18)"
                  : undefined,
            transition: "box-shadow 0.4s ease",
          }}
        >
          <AnimatePresence mode="wait">
            {status === "success" ? (
              /* ── SUCCESS STATE ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)",
                    boxShadow: "0 0 28px rgba(212,175,55,0.45)",
                  }}
                >
                  <CheckCircle2 className="h-8 w-8 text-black" strokeWidth={2.5} />
                </motion.div>

                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Lights. Camera. Action!
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">Verification successful 🎬</p>
                <p className="mt-1 text-xs text-muted-foreground opacity-60">
                  Redirecting you to the studio…
                </p>

                {/* Animated film-strip dots */}
                <div className="mt-6 flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "linear-gradient(135deg, #D4AF37, #FFD700)" }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              /* ── INPUT STATE ── */
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: "rgba(212,175,55,0.12)",
                      border: "1px solid rgba(212,175,55,0.2)",
                    }}
                  >
                    <Film className="h-4 w-4 text-gold" style={{ color: "#D4AF37" }} />
                  </div>
                  <div>
                    <h1 className="font-display text-3xl font-semibold text-foreground">
                      Verify your pass
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We sent a 6-digit code to{" "}
                      <span className="font-medium" style={{ color: "#D4AF37" }}>
                        {resolvedEmail || "your email"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* OTP inputs */}
                <div className="mt-8 flex justify-center gap-3">
                  {digits.map((digit, i) => (
                    <OtpBox
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      value={digit}
                      hasError={status === "error"}
                      onChange={(v) => updateDigit(i, v)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onPaste={handlePaste}
                    />
                  ))}
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {status === "error" && (
                    <motion.p
                      key="err"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-4 rounded-lg border px-3 py-2 text-center text-xs"
                      style={{
                        borderColor: "rgba(239,68,68,0.3)",
                        background: "rgba(239,68,68,0.08)",
                        color: "rgb(252,165,165)",
                      }}
                    >
                      {errorMsg}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Verify button */}
                <button
                  onClick={handleVerify}
                  disabled={!canVerify}
                  className="group relative mt-6 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full py-3 text-sm font-semibold text-black shadow-gold transition disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)" }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Verifying…
                    </>
                  ) : (
                    "Verify & enter the studio"
                  )}
                </button>

                {/* Resend row */}
                <div className="mt-5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                  <span>Didn't receive it?</span>
                  {countdown > 0 ? (
                    <span className="tabular-nums" style={{ color: "#D4AF37" }}>
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="font-medium transition hover:opacity-80 disabled:opacity-40"
                      style={{ color: "#D4AF37" }}
                    >
                      {resending ? "Sending…" : "Resend OTP"}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Back link */}
        {status !== "success" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Wrong email?{" "}
            <Link
              to="/signup"
              className="font-medium transition hover:opacity-80"
              style={{ color: "#D4AF37" }}
            >
              Go back
            </Link>
          </p>
        )}
      </motion.div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(212,175,55,0.25), 0 0 12px rgba(212,175,55,0.1); }
          50%       { box-shadow: 0 0 0 2px rgba(255,215,0,0.5),  0 0 20px rgba(255,215,0,0.2); }
        }
        .otp-box-focused { animation: goldPulse 2s ease-in-out infinite; }

        @keyframes errorGlow {
          0%, 100% { box-shadow: 0 0 0 2px rgba(239,68,68,0.4); }
          50%       { box-shadow: 0 0 0 2px rgba(239,68,68,0.7), 0 0 12px rgba(239,68,68,0.25); }
        }
        .otp-box-error { animation: errorGlow 1.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// ─── OtpBox sub-component ─────────────────────────────────────────────────────

import {
  forwardRef,
  type ClipboardEvent as RClipboardEvent,
  type KeyboardEvent as RKeyboardEvent,
} from "react";

interface OtpBoxProps {
  value: string;
  hasError: boolean;
  onChange: (v: string) => void;
  onKeyDown: (e: RKeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: RClipboardEvent<HTMLInputElement>) => void;
}

const OtpBox = forwardRef<HTMLInputElement, OtpBoxProps>(
  ({ value, hasError, onChange, onKeyDown, onPaste }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={1}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`otp-digit ${focused ? "otp-box-focused" : ""} ${hasError && !focused ? "otp-box-error" : ""}`}
        style={{
          width: "3rem",
          height: "3.5rem",
          textAlign: "center",
          fontSize: "1.375rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          background: value ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.03)",
          border: hasError
            ? "1.5px solid rgba(239,68,68,0.5)"
            : value
              ? "1.5px solid rgba(212,175,55,0.5)"
              : "1.5px solid rgba(255,255,255,0.08)",
          borderRadius: "0.875rem",
          color: value ? "#FFD700" : "rgba(255,255,255,0.9)",
          outline: "none",
          caretColor: "#D4AF37",
          transition: "all 0.2s ease",
        }}
      />
    );
  },
);
OtpBox.displayName = "OtpBox";
