import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, RefreshCw, AlertCircle, X, Share2, Copy, Check, Lock, Loader2 } from "lucide-react";
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
  | "idle" // button not yet clicked
  | "generating" // POST /share in flight
  | "revealing" // cinematic link-reveal animation
  | "ready" // link shown, copy available
  | "copied"; // clipboard success

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
 *  Cinematic Share Panel
 * ───────────────────────────────────────────────────────────── */

/**
 * Typewriter effect — reveals a string char-by-char using state.
 * Used in the "revealing" phase to make the URL appear letter by letter.
 */
function useTypewriter(text: string, active: boolean, speed = 28) {
  const [displayed, setDisplayed] = useState("");

  // Reset whenever text or active changes
  useState(() => {
    if (!active) {
      setDisplayed("");
      return;
    }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  });

  return displayed;
}

interface SharePanelProps {
  scriptId: string;
  isPublic: boolean;
  existingToken?: string;
}

function SharePanel({ scriptId, isPublic: initialIsPublic, existingToken }: SharePanelProps) {
  const [phase, setPhase] = useState<SharePhase>(
    initialIsPublic && existingToken ? "ready" : "idle",
  );
  const [shareUrl, setShareUrl] = useState<string>(
    initialIsPublic && existingToken ? `${window.location.origin}/share/${existingToken}` : "",
  );
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shareError, setShareError] = useState<string | null>(null);

  /* Typewriter runs during "revealing" phase */
  const typedUrl = useTypewriter(shareUrl, phase === "revealing");

  const handleShare = useCallback(async () => {
    if (phase === "generating") return;
    setShareError(null);
    setPhase("generating");

    try {
      const res = await scriptApi.share(scriptId);
      const url = res.shareUrl || `${window.location.origin}/share/${res.shareToken}`;
      setShareUrl(url);
      setIsPublic(true);
      setPhase("revealing");

      // After typewriter finishes (~url.length * 28 ms), switch to "ready"
      setTimeout(() => setPhase("ready"), url.length * 28 + 400);
    } catch (e: any) {
      setShareError(e.message || "Failed to generate link. Please try again.");
      setPhase("idle");
    }
  }, [phase, scriptId]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setPhase("copied");
      setTimeout(() => setPhase("ready"), 2200);
    } catch {
      /* clipboard blocked — just show the URL */
    }
  }, [shareUrl]);

  const handleUnshare = useCallback(async () => {
    try {
      await scriptApi.unshare(scriptId);
      setIsPublic(false);
      setPhase("idle");
      setShareUrl("");
    } catch (e: any) {
      setShareError(e.message || "Failed to make private.");
    }
  }, [scriptId]);

  /* ── Label text for the primary button ── */
  const buttonLabel =
    phase === "generating"
      ? "Generating link…"
      : phase === "revealing"
        ? "Encrypting…"
        : isPublic
          ? "Share again"
          : "Share drama card";

  return (
    <div className="mt-8">
      {/* ── Divider ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <span className="text-[9px] uppercase tracking-[0.35em] text-gold/50">Share</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold/20 to-transparent" />
      </div>

      {/* ── Primary share button ── */}
      <AnimatePresence mode="wait">
        {(phase === "idle" ||
          phase === "generating" ||
          phase === "revealing" ||
          (isPublic && phase !== "ready" && phase !== "copied")) && (
          <motion.div
            key="share-btn"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex justify-center"
          >
            <motion.button
              onClick={handleShare}
              disabled={phase === "generating" || phase === "revealing"}
              whileHover={{ scale: phase === "idle" ? 1.04 : 1 }}
              whileTap={{ scale: phase === "idle" ? 0.97 : 1 }}
              className={[
                "relative group overflow-hidden",
                "flex items-center gap-2.5 rounded-full px-6 py-2.5",
                "text-[11px] font-semibold uppercase tracking-[0.25em]",
                "transition-all duration-300",
                phase === "idle"
                  ? [
                      "bg-gradient-to-r from-gold/20 via-gold/30 to-amber-400/20",
                      "border border-gold/40 text-gold",
                      "hover:border-gold/70 hover:from-gold/30 hover:via-gold/40 hover:to-amber-400/30",
                      "shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]",
                    ].join(" ")
                  : "border border-gold/20 text-gold/50 cursor-not-allowed bg-black/20",
              ].join(" ")}
            >
              {/* Shimmer sweep on idle */}
              {phase === "idle" && (
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none"
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear", repeatDelay: 1.2 }}
                />
              )}

              {phase === "generating" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : phase === "revealing" ? (
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </motion.span>
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              <span>{buttonLabel}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Generation animation — scanning lines ── */}
      <AnimatePresence>
        {phase === "generating" && (
          <motion.div
            key="generating-anim"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 overflow-hidden"
          >
            <div className="rounded-2xl border border-gold/10 bg-black/40 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  className="h-1.5 w-1.5 rounded-full bg-gold"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                <span className="text-[10px] uppercase tracking-[0.3em] text-gold/60">
                  Link generation in progress
                </span>
              </div>
              {/* Animated scan bars */}
              {[0.0, 0.15, 0.3].map((delay, i) => (
                <motion.div
                  key={i}
                  className="mb-2 h-1.5 rounded-full bg-gradient-to-r from-gold/30 via-amber-400/50 to-gold/10"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: [0, 1, 0.6, 1] }}
                  transition={{
                    duration: 1.4,
                    delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ width: ["100%", "80%", "90%"][i] }}
                />
              ))}
              <p className="mt-3 text-[9px] tracking-widest text-gold/30 text-center">
                ENCRYPTING · SECURING · GENERATING
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Typewriter URL reveal ── */}
      <AnimatePresence>
        {phase === "revealing" && (
          <motion.div
            key="typewriter"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-2xl border border-gold/20 bg-black/50 px-4 py-3 backdrop-blur-sm"
          >
            <p className="text-[9px] uppercase tracking-[0.3em] text-gold/40 mb-1.5">Public link</p>
            <p className="font-mono text-xs text-gold/80 break-all leading-relaxed">
              {typedUrl}
              <motion.span
                className="inline-block w-0.5 h-3 bg-gold ml-0.5 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Ready / Copied state — full share card ── */}
      <AnimatePresence>
        {(phase === "ready" || phase === "copied") && (
          <motion.div
            key="share-card"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="mt-4 rounded-2xl border border-gold/25 bg-gradient-to-br from-black/60 via-gold/5 to-black/60 backdrop-blur-sm overflow-hidden"
          >
            {/* Top bar */}
            <div className="flex items-center gap-2 border-b border-gold/10 px-4 py-2.5">
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[9px] uppercase tracking-[0.35em] text-gold/50 flex-1">
                Public share link · active
              </span>
              <Share2 className="h-3 w-3 text-gold/30" />
            </div>

            {/* URL display */}
            <div className="px-4 py-3">
              <p className="font-mono text-xs text-gold/70 break-all leading-relaxed">{shareUrl}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-gold/10 px-4 py-3">
              {/* Copy button */}
              <motion.button
                onClick={handleCopy}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={[
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-[10px]",
                  "font-semibold uppercase tracking-[0.2em] transition-all duration-200",
                  phase === "copied"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : "bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 hover:border-gold/40",
                ].join(" ")}
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
                      <Check className="h-3 w-3" />
                      Copied!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-3 w-3" />
                      Copy link
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Make private button */}
              <motion.button
                onClick={handleUnshare}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                title="Make private"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-white/30 hover:border-white/20 hover:text-white/50 transition-colors"
              >
                <Lock className="h-3 w-3" />
                Make private
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share error */}
      <AnimatePresence>
        {shareError && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-none text-red-400" />
            <p className="text-xs text-red-300 flex-1">{shareError}</p>
            <button onClick={() => setShareError(null)}>
              <X className="h-3.5 w-3.5 text-red-400/60 hover:text-red-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  Main OutputDisplay component
 * ───────────────────────────────────────────────────────────── */

export function OutputDisplay({ script: initialScript }: { script: Script }) {
  const [script, setScript] = useState<Script>(initialScript);

  const [regenerating, setRegenerating] = useState<RegeneratingState>({
    title: false,
    tagline: false,
    scenes: {},
  });

  const [error, setError] = useState<string | null>(null);

  const scriptId = (script as any)._id ?? script.id;
  const isPublic: boolean = (script as any).isPublic ?? false;
  const existingToken: string | undefined = (script as any).shareToken;

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

          {/* ── Share panel ───────────────────────────────────── */}
          {scriptId && (
            <SharePanel scriptId={scriptId} isPublic={isPublic} existingToken={existingToken} />
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
  );
}
