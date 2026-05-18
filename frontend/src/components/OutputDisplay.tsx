import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, RefreshCw, AlertCircle, X, Share2, Copy, Check, Loader2 } from "lucide-react";
import type { Script } from "@/lib/mockScript";
import { CharacterCard } from "./CharacterCard";
import { SceneCard } from "./SceneCard";
import { scriptApi } from "@/lib/api";

/* ─────────────────────────────────────────────────────────────
 *  Types
 * ───────────────────────────────────────────────────────────── */

interface RegeneratingState {
  title: boolean;
  tagline: boolean;
  scenes: Record<number, boolean>;
}

type SharePhase =
  | "idle"
  | "modal-open" // modal visible, hasn't started yet
  | "generating" // circular timer + stages running
  | "done" // link ready, showing in modal
  | "copied"; // clipboard success

const STAGES = [
  { label: "Authenticating request", icon: "🔐" },
  { label: "Encrypting your screenplay", icon: "🎬" },
  { label: "Minting share token", icon: "🪄" },
  { label: "Publishing to the cloud", icon: "☁️" },
  { label: "Link ready!", icon: "✨" },
];

/* ─────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────── */

function Spinner({ className = "" }: { className?: string }) {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`inline-block ${className}`}
    >
      <RefreshCw className="h-3 w-3" />
    </motion.span>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  Circular countdown timer SVG
 * ───────────────────────────────────────────────────────────── */

function CircularTimer({ progress, stage }: { progress: number; stage: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(rgba(212,175,55,0.25) ${progress * 360}deg, transparent 0deg)`,
          filter: "blur(8px)",
        }}
      />

      {/* SVG track + arc */}
      <svg width="140" height="140" className="absolute inset-0 -rotate-90">
        {/* Track */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgba(212,175,55,0.12)"
          strokeWidth="6"
        />
        {/* Progress arc */}
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="url(#goldArc)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="goldArc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9A227" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="relative flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-3xl"
          >
            {STAGES[Math.min(stage, STAGES.length - 1)].icon}
          </motion.div>
        </AnimatePresence>
        <p className="mt-1 text-[11px] font-bold tabular-nums text-gold">
          {stage < STAGES.length - 1 ? `${stage + 1} / ${STAGES.length}` : "✓"}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  Premium Share Modal
 * ───────────────────────────────────────────────────────────── */

interface ShareModalProps {
  scriptId: string;
  onClose: () => void;
}

function ShareModal({ scriptId, onClose }: ShareModalProps) {
  const [phase, setPhase] = useState<"idle" | "generating" | "done" | "copied">("idle");
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [shareUrl, setShareUrl] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiCallRef = useRef(false);

  // Start generating as soon as modal opens
  useEffect(() => {
    startGeneration();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startGeneration = useCallback(async () => {
    setPhase("generating");
    setCurrentStage(0);
    setProgress(0);
    setShareError(null);
    apiCallRef.current = false;

    const totalDuration = 5000; // 5 seconds
    const tickInterval = 50; // ms per tick
    const totalTicks = totalDuration / tickInterval;
    let tick = 0;

    intervalRef.current = setInterval(() => {
      tick++;
      const rawProgress = tick / totalTicks;
      setProgress(Math.min(rawProgress, 1));
      setCurrentStage(Math.min(Math.floor(rawProgress * STAGES.length), STAGES.length - 1));

      if (tick >= totalTicks) {
        clearInterval(intervalRef.current!);
      }
    }, tickInterval);

    // Fire real API call in parallel
    try {
      const res = await scriptApi.share(scriptId);
      // Normalise: if the API returns a relative path (e.g. "/share/token"),
      // prepend the current origin so the displayed URL is always absolute.
      const raw = res.shareUrl || `/share/${res.shareToken}`;
      const url = raw.startsWith("http") ? raw : `${window.location.origin}${raw}`;
      setShareUrl(url);
      apiCallRef.current = true;
    } catch (e: any) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setShareError(e.message || "Failed to generate link. Please try again.");
      setPhase("idle");
      return;
    }

    // Wait for the 5-second cinematic to finish, then flip to done
    const elapsed = tick * tickInterval;
    const remaining = Math.max(totalDuration - elapsed, 0);
    setTimeout(() => {
      setPhase("done");
    }, remaining);
  }, [scriptId]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setPhase("copied");
      setTimeout(() => setPhase("done"), 2200);
    } catch {
      /* clipboard blocked */
    }
  }, [shareUrl]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      >
        {/* Modal card */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(135deg, #0e0e0e 0%, #141008 50%, #0a0a0a 100%)",
            border: "1px solid rgba(212,175,55,0.25)",
            boxShadow:
              "0 0 0 1px rgba(212,175,55,0.08), 0 32px 80px rgba(0,0,0,0.9), 0 0 60px rgba(212,175,55,0.08)",
          }}
        >
          {/* Top grain overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
              backgroundSize: "128px 128px",
            }}
          />

          {/* Ambient glow top */}
          <div
            className="pointer-events-none absolute -top-20 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full"
            style={{
              background: "radial-gradient(ellipse, rgba(212,175,55,0.18) 0%, transparent 70%)",
            }}
          />

          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  background: "rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.25)",
                }}
              >
                <Share2 className="h-3.5 w-3.5 text-gold" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold/50">CineScript AI</p>
                <p className="text-sm font-semibold text-white/90">Share your screenplay</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <X className="h-3.5 w-3.5 text-white/40" />
            </motion.button>
          </div>

          {/* Body */}
          <div className="relative px-6 py-8">
            <AnimatePresence mode="wait">
              {/* ── GENERATING PHASE ── */}
              {phase === "generating" && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-6"
                >
                  {/* Circular timer */}
                  <CircularTimer progress={progress} stage={currentStage} />

                  {/* Stage list */}
                  <div className="w-full space-y-2">
                    {STAGES.map((s, i) => {
                      const isDone = i < currentStage;
                      const isActive = i === currentStage;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 rounded-xl px-3 py-2"
                          style={{
                            background: isActive ? "rgba(212,175,55,0.08)" : "transparent",
                            border: isActive
                              ? "1px solid rgba(212,175,55,0.18)"
                              : "1px solid transparent",
                          }}
                        >
                          <div
                            className="flex h-5 w-5 flex-none items-center justify-center rounded-full transition-all duration-300"
                            style={{
                              background: isDone
                                ? "rgba(52,211,153,0.15)"
                                : isActive
                                  ? "rgba(212,175,55,0.15)"
                                  : "rgba(255,255,255,0.04)",
                              border: isDone
                                ? "1px solid rgba(52,211,153,0.4)"
                                : isActive
                                  ? "1px solid rgba(212,175,55,0.4)"
                                  : "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {isDone ? (
                              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <Check className="h-2.5 w-2.5 text-emerald-400" />
                              </motion.span>
                            ) : isActive ? (
                              <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                              >
                                <Loader2 className="h-2.5 w-2.5 text-gold" />
                              </motion.span>
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                            )}
                          </div>
                          <span
                            className="text-xs transition-all duration-300"
                            style={{
                              color: isDone
                                ? "rgba(52,211,153,0.8)"
                                : isActive
                                  ? "rgba(212,175,55,0.9)"
                                  : "rgba(255,255,255,0.25)",
                              fontWeight: isActive ? 600 : 400,
                            }}
                          >
                            {s.label}
                          </span>

                          {/* Active pulse dot */}
                          {isActive && (
                            <motion.div
                              className="ml-auto h-1.5 w-1.5 rounded-full bg-gold"
                              animate={{ opacity: [1, 0.2, 1] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  <p className="text-center text-[10px] uppercase tracking-[0.35em] text-white/20">
                    Please wait · Do not close
                  </p>
                </motion.div>
              )}

              {/* ── DONE / COPIED PHASE ── */}
              {(phase === "done" || phase === "copied") && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 26 }}
                  className="flex flex-col items-center gap-5"
                >
                  {/* Success icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                    className="relative flex h-16 w-16 items-center justify-center rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 70%)",
                      border: "1px solid rgba(212,175,55,0.35)",
                      boxShadow: "0 0 30px rgba(212,175,55,0.2)",
                    }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <Share2 className="h-7 w-7 text-gold" />
                    </motion.div>
                    {/* Orbiting sparkle */}
                    <motion.div
                      className="absolute h-2 w-2 rounded-full bg-gold"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{ top: -4, right: -4 }}
                    />
                  </motion.div>

                  <div className="text-center">
                    <p className="font-display text-xl font-semibold text-gold">
                      Your link is live!
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      Anyone with this link can view your screenplay
                    </p>
                  </div>

                  {/* URL box */}
                  <div
                    className="w-full rounded-2xl p-3"
                    style={{
                      background: "rgba(212,175,55,0.04)",
                      border: "1px solid rgba(212,175,55,0.15)",
                    }}
                  >
                    <p className="mb-1 text-[9px] uppercase tracking-[0.3em] text-gold/40">
                      Share URL
                    </p>
                    <p className="break-all font-mono text-xs leading-relaxed text-gold/70">
                      {shareUrl}
                    </p>
                  </div>

                  {/* Copy button */}
                  <motion.button
                    onClick={handleCopy}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3 text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-200"
                    style={
                      phase === "copied"
                        ? {
                            background: "rgba(52,211,153,0.12)",
                            border: "1px solid rgba(52,211,153,0.3)",
                            color: "rgb(52,211,153)",
                          }
                        : {
                            background:
                              "linear-gradient(135deg, rgba(201,162,39,0.25) 0%, rgba(255,215,0,0.15) 100%)",
                            border: "1px solid rgba(212,175,55,0.4)",
                            color: "rgb(212,175,55)",
                            boxShadow: "0 0 20px rgba(212,175,55,0.12)",
                          }
                    }
                  >
                    <AnimatePresence mode="wait">
                      {phase === "copied" ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Copied to clipboard!
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy link
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {shareError && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2"
                >
                  <AlertCircle className="h-3.5 w-3.5 flex-none text-red-400" />
                  <p className="flex-1 text-xs text-red-300">{shareError}</p>
                  <button onClick={() => setShareError(null)}>
                    <X className="h-3.5 w-3.5 text-red-400/60 hover:text-red-400" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 px-6 py-3 text-center">
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/15">
              CineScript AI · Secure Public Link
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  Section header
 * ───────────────────────────────────────────────────────────── */

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-white/5 pb-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
        <h3 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{title}</h3>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  Regen button
 * ───────────────────────────────────────────────────────────── */

interface RegenButtonProps {
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}

function RegenButton({ loading, disabled, onClick, label }: RegenButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: loading || disabled ? 1 : 1.05 }}
      whileTap={{ scale: loading || disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={loading || disabled}
      title={label}
      className={[
        "flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors duration-200",
        "text-[10px] uppercase tracking-[0.2em]",
        loading || disabled
          ? "cursor-not-allowed border-gold/10 text-gold/30"
          : "border-gold/30 text-gold/70 hover:border-gold/60 hover:bg-gold/5 hover:text-gold",
      ].join(" ")}
    >
      {loading ? <Spinner /> : <RefreshCw className="h-3 w-3" />}
      <span>{label}</span>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  Error banner
 * ───────────────────────────────────────────────────────────── */

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-red-400" />
      <p className="flex-1 text-sm text-red-300">{message}</p>
      <button onClick={onDismiss} className="flex-none text-red-400/60 hover:text-red-400">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  Main OutputDisplay component
 * ───────────────────────────────────────────────────────────── */

export function OutputDisplay({ script: initialScript }: { script: Script }) {
  const [script, setScript] = useState<Script>(initialScript);
  const [showShareModal, setShowShareModal] = useState(false);

  const [regenerating, setRegenerating] = useState<RegeneratingState>({
    title: false,
    tagline: false,
    scenes: {},
  });

  const [error, setError] = useState<string | null>(null);

  const scriptId = (script as any)._id ?? script.id;

  const anyRegenerating =
    regenerating.title || regenerating.tagline || Object.values(regenerating.scenes).some(Boolean);

  /* ── Regenerate title ────────────────────────────────────── */
  const handleRegenerateTitle = useCallback(async () => {
    if (!scriptId || anyRegenerating) return;
    setRegenerating((prev) => ({ ...prev, title: true }));
    setError(null);
    try {
      const result = await scriptApi.regenerateSection(scriptId, "title");
      setScript((prev) => ({ ...prev, title: result.title }));
    } catch (e: any) {
      setError(e.message || "Failed to regenerate title. Please try again.");
    } finally {
      setRegenerating((prev) => ({ ...prev, title: false }));
    }
  }, [scriptId, anyRegenerating]);

  /* ── Regenerate tagline ──────────────────────────────────── */
  const handleRegenerateTagline = useCallback(async () => {
    if (!scriptId || anyRegenerating) return;
    setRegenerating((prev) => ({ ...prev, tagline: true }));
    setError(null);
    try {
      const result = await scriptApi.regenerateSection(scriptId, "tagline");
      setScript((prev) => ({ ...prev, tagline: result.tagline }));
    } catch (e: any) {
      setError(e.message || "Failed to regenerate tagline. Please try again.");
    } finally {
      setRegenerating((prev) => ({ ...prev, tagline: false }));
    }
  }, [scriptId, anyRegenerating]);

  /* ── Regenerate a specific scene ─────────────────────────── */
  const handleRegenerateScene = useCallback(
    async (sceneNumber: number) => {
      if (!scriptId || anyRegenerating) return;
      setRegenerating((prev) => ({
        ...prev,
        scenes: { ...prev.scenes, [sceneNumber]: true },
      }));
      setError(null);
      try {
        const result = await scriptApi.regenerateSection(scriptId, "scene", sceneNumber);
        setScript((prev) => ({
          ...prev,
          scenes: prev.scenes.map((s) => {
            const updated = result.scenes.find((rs) => rs.number === sceneNumber);
            return s.number === sceneNumber && updated ? updated : s;
          }),
        }));
      } catch (e: any) {
        setError(e.message || `Failed to regenerate scene ${sceneNumber}. Please try again.`);
      } finally {
        setRegenerating((prev) => ({
          ...prev,
          scenes: { ...prev.scenes, [sceneNumber]: false },
        }));
      }
    },
    [scriptId, anyRegenerating],
  );

  const characters = script.characters ?? [];
  const scenes = script.scenes ?? [];

  return (
    <>
      {/* ── Premium Share Modal (portal-like, fixed overlay) ── */}
      <AnimatePresence>
        {showShareModal && scriptId && (
          <ShareModal scriptId={scriptId} onClose={() => setShowShareModal(false)} />
        )}
      </AnimatePresence>

      <section className="relative z-10 mx-auto mt-16 w-full max-w-6xl px-6">
        {/* ── Hero card — Title & Tagline ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl glass-gold p-8 sm:p-12 grain"
        >
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />

          <div className="relative text-center">
            {/* Mood pill */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-gold">
              <Film className="h-3 w-3" /> {script.mood} · Original Screenplay
            </div>

            {/* ── TITLE ─────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              <motion.h2
                key={script.title}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.35 }}
                className="font-display text-5xl font-bold leading-tight text-gold-gradient sm:text-7xl"
              >
                {script.title}
              </motion.h2>
            </AnimatePresence>

            {/* ── TAGLINE ───────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              <motion.p
                key={script.tagline}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="mx-auto mt-4 max-w-2xl font-display text-lg italic text-foreground/80 sm:text-xl"
              >
                "{script.tagline}"
              </motion.p>
            </AnimatePresence>

            {/* ── Regenerate controls ──────────────────────────── */}
            {scriptId && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <RegenButton
                  loading={regenerating.title}
                  disabled={anyRegenerating && !regenerating.title}
                  onClick={handleRegenerateTitle}
                  label="New Title"
                />
                <RegenButton
                  loading={regenerating.tagline}
                  disabled={anyRegenerating && !regenerating.tagline}
                  onClick={handleRegenerateTagline}
                  label="New Tagline"
                />
              </div>
            )}

            {/* ── Share divider + button ───────────────────────── */}
            {scriptId && (
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
                  <span className="text-[9px] uppercase tracking-[0.35em] text-gold/50">Share</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold/20 to-transparent" />
                </div>

                <div className="flex justify-center">
                  <motion.button
                    onClick={() => setShowShareModal(true)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative group overflow-hidden flex items-center gap-2.5 rounded-full px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.25em] transition-all duration-300"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(201,162,39,0.2) 0%, rgba(212,175,55,0.3) 50%, rgba(255,191,0,0.2) 100%)",
                      border: "1px solid rgba(212,175,55,0.4)",
                      color: "rgb(212,175,55)",
                      boxShadow: "0 0 20px rgba(212,175,55,0.15)",
                    }}
                  >
                    {/* Shimmer sweep */}
                    <motion.span
                      className="absolute inset-0 -skew-x-12 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                      }}
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 1.2,
                      }}
                    />
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share drama card</span>
                  </motion.button>
                </div>
              </div>
            )}

            {/* Error banner */}
            <AnimatePresence>
              {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Cast ────────────────────────────────────────────── */}
        {characters.length > 0 && (
          <div className="mt-14">
            <SectionHeader eyebrow="The Cast" title="Characters" />
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {characters.map((c, i) => (
                <CharacterCard key={c.name ?? i} character={c} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Scenes ──────────────────────────────────────────── */}
        <div className="mt-16 pb-20">
          <SectionHeader eyebrow="Screenplay" title="Scenes" />
          {scenes.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No scenes were generated. Please try again.
            </p>
          ) : (
            <div className="mt-6 space-y-5">
              {scenes.map((s, i) => (
                <SceneCard
                  key={(s as any)._id ?? s.number ?? i}
                  scene={s}
                  index={i}
                  onRegenerate={scriptId ? () => handleRegenerateScene(s.number) : undefined}
                  isRegenerating={!!regenerating.scenes[s.number]}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
