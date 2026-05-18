import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import type { Scene } from "@/lib/mockScript";

interface SceneCardProps {
  scene: Scene;
  index: number;
  /** Called when the user clicks the regenerate button for this scene. */
  onRegenerate?: () => void;
  /** Whether this scene is currently being regenerated. */
  isRegenerating?: boolean;
}

export function SceneCard({ scene, index, onRegenerate, isRegenerating = false }: SceneCardProps) {
  const dialogues = scene.dialogues ?? [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-3xl glass p-6 sm:p-8"
    >
      {/* Top shimmer border */}
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Regenerating overlay — covers content with a subtle pulse */}
      <AnimatePresence>
        {isRegenerating && (
          <motion.div
            key="regen-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-3xl bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="h-7 w-7 text-gold" />
            </motion.div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold/80">Rewriting scene…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Scene number badge */}
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-gold/30 bg-gold/5 font-display text-lg font-bold text-gold">
            {String(scene.number).padStart(2, "0")}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Scene {scene.number}
            </p>
            <h3 className="font-display text-2xl font-semibold text-foreground">{scene.title}</h3>
          </div>
        </div>

        {/* Regenerate button — only shown when a handler is provided */}
        {onRegenerate && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRegenerate}
            disabled={isRegenerating}
            title="Regenerate this scene"
            className={[
              "flex flex-none items-center gap-1.5 rounded-full border px-3 py-1.5",
              "text-[10px] uppercase tracking-[0.2em] transition-colors duration-200",
              isRegenerating
                ? "cursor-not-allowed border-gold/10 text-gold/30"
                : "border-gold/30 text-gold/70 hover:border-gold/60 hover:bg-gold/5 hover:text-gold",
            ].join(" ")}
          >
            <RefreshCw className={["h-3 w-3", isRegenerating ? "animate-spin" : ""].join(" ")} />
            <span className="hidden sm:inline">Regenerate</span>
          </motion.button>
        )}
      </header>

      {/* ── Scene description ───────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.p
          key={scene.description}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-5 text-sm italic leading-relaxed text-muted-foreground sm:text-base"
        >
          {scene.description}
        </motion.p>
      </AnimatePresence>

      {/* ── Dialogue block ──────────────────────────────────────── */}
      <div className="mt-6 space-y-3 border-l-2 border-gold/30 pl-5">
        {/* AnimatePresence without mode="wait" — dialogues can be multiple children */}
        <AnimatePresence>
          {dialogues.length === 0 ? (
            <motion.p
              key="no-dialogue"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm italic text-muted-foreground"
            >
              No dialogue for this scene.
            </motion.p>
          ) : (
            dialogues.map((d, i) => (
              <motion.div
                key={`${d.character}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: i * 0.06 }}
                className="text-sm sm:text-base"
              >
                <span className="font-display font-semibold uppercase tracking-wider text-gold">
                  {d.character}:
                </span>{" "}
                <span className="text-foreground/90">{d.line}</span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
