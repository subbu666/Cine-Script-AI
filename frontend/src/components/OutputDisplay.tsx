import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, RefreshCw, AlertCircle, X } from "lucide-react";
import type { Script } from "@/lib/mockScript";
import { CharacterCard } from "./CharacterCard";
import { SceneCard } from "./SceneCard";
import { scriptApi } from "@/lib/api";

/* ─────────────────────────────────────────────────────────────
 *  Types
 * ───────────────────────────────────────────────────────────── */

/** Tracks which sections are currently waiting for the AI. */
interface RegeneratingState {
  title: boolean;
  tagline: boolean;
  /** Keyed by scene.number */
  scenes: Record<number, boolean>;
}

/* ─────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────── */

/** Small inline spinner used inside header-level regen buttons. */
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
 *  Section header — reused for Cast + Scenes sections
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
 *  Inline regenerate button — used for title / tagline
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
 *  Error toast — appears at the bottom of the card
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
  /**
   * Keep a local copy of the script so individual section regenerations
   * update in-place without re-mounting the whole component or requiring
   * a lift-up to the parent.
   */
  const [script, setScript] = useState<Script>(initialScript);

  const [regenerating, setRegenerating] = useState<RegeneratingState>({
    title: false,
    tagline: false,
    scenes: {},
  });

  const [error, setError] = useState<string | null>(null);

  // Resolve the script's MongoDB _id (the backend stores it as _id, the
  // normalizeScript helper copies it to id, but both may be present).
  const scriptId = (script as any)._id ?? script.id;

  /** True when any regeneration is in flight — used to disable other buttons. */
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
        // Swap only the regenerated scene; keep all others intact
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

          {/* ── TITLE ───────────────────────────────────────── */}
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

          {/* ── TAGLINE ─────────────────────────────────────── */}
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
