import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Clapperboard, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { scriptApi } from "@/lib/api";
import type { Script } from "@/lib/mockScript";

/* ─────────────────────────────────────────────────────────────
 *  Route definition
 * ───────────────────────────────────────────────────────────── */

export const Route = createFileRoute("/Share/$token")({
  component: SharedScriptPage,
  head: () => ({
    meta: [
      { title: "CineScript · Shared Drama" },
      { name: "description", content: "A drama shared from CineScript — AI Bollywood Script Generator." },
    ],
  }),
});

/* ─────────────────────────────────────────────────────────────
 *  Shared script scene card (read-only, no regen button)
 * ───────────────────────────────────────────────────────────── */

function SharedSceneCard({ scene, index }: { scene: Script["scenes"][0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.5 }}
      className="rounded-2xl border border-white/5 bg-black/30 backdrop-blur-sm overflow-hidden"
    >
      {/* Scene header */}
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-3">
        <span className="font-mono text-[10px] text-gold/50 uppercase tracking-widest">
          Scene {scene.number}
        </span>
        <div className="flex-1 h-px bg-white/5" />
        <Clapperboard className="h-3.5 w-3.5 text-gold/30" />
      </div>

      <div className="p-5">
        {/* Scene title */}
        <h4 className="font-display text-lg font-semibold text-foreground mb-2">
          {scene.title}
        </h4>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {scene.description}
        </p>

        {/* Dialogues */}
        {scene.dialogues && scene.dialogues.length > 0 && (
          <div className="space-y-3 border-t border-white/5 pt-4">
            {scene.dialogues.map((d: { character: string; line: string }, i: number) => (
              <div key={i} className="flex gap-3">
                <span className="min-w-[80px] text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70 pt-0.5">
                  {d.character}
                </span>
                <p className="flex-1 text-sm italic text-foreground/75 leading-relaxed">
                  "{d.line}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  Loading skeleton
 * ───────────────────────────────────────────────────────────── */

function SharedScriptSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-2/3 mx-auto rounded-xl bg-white/5" />
      <div className="h-4 w-1/2 mx-auto rounded-lg bg-white/5" />
      <div className="mt-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  Main page component
 * ───────────────────────────────────────────────────────────── */

function SharedScriptPage() {
  const { token } = Route.useParams();

  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("Invalid share link."); setLoading(false); return; }

    scriptApi
      .getShared(token)
      .then((s) => setScript(s))
      .catch((e: any) => setError(e.message || "This script is no longer available."))
      .finally(() => setLoading(false));
  }, [token]);

  const scenes = script?.scenes ?? [];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* ── Ambient glow ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-amber-900/10 blur-[100px]" />
      </div>

      {/* ── Minimal top bar ── */}
      <header className="relative z-10 border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-gold/60 hover:text-gold transition-colors text-xs uppercase tracking-[0.25em]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            CineScript
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-gold/20 bg-black/30 px-3 py-1 text-[9px] uppercase tracking-[0.3em] text-gold/50">
            <Film className="h-3 w-3" />
            Shared Drama
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-12">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-8 w-8 text-gold/50" />
            </motion.div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold/30">Loading drama…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center"
          >
            <AlertCircle className="mx-auto h-10 w-10 text-red-400/60 mb-4" />
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">
              Drama unavailable
            </h2>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold hover:bg-gold/20 transition-colors"
            >
              Create your own drama
            </Link>
          </motion.div>
        )}

        {/* Script */}
        {!loading && script && (
          <AnimatePresence>
            {/* ── Hero card ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-black/70 via-gold/5 to-black/70 backdrop-blur-md p-8 sm:p-12 text-center mb-10"
            >
              {/* Glow */}
              <div className="absolute -top-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl pointer-events-none" />

              <div className="relative">
                {/* Mood pill */}
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-gold">
                  <Film className="h-3 w-3" />
                  {script.mood} · Original Screenplay
                </div>

                {/* Title */}
                <h1 className="font-display text-4xl font-bold leading-tight text-gold-gradient sm:text-6xl">
                  {script.title}
                </h1>

                {/* Tagline */}
                <p className="mx-auto mt-4 max-w-2xl font-display text-lg italic text-foreground/70 sm:text-xl">
                  "{script.tagline}"
                </p>

                {/* Divider */}
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
                  <span className="text-[9px] uppercase tracking-[0.4em] text-gold/30">
                    {scenes.length} Scene{scenes.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold/20 to-transparent" />
                </div>
              </div>
            </motion.div>

            {/* ── Scenes ── */}
            <div className="space-y-4">
              {scenes.map((scene, i) => (
                <SharedSceneCard key={(scene as any)._id ?? scene.number ?? i} scene={scene} index={i} />
              ))}
            </div>

            {/* ── Footer CTA ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + scenes.length * 0.08 }}
              className="mt-12 text-center"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
                Create your own Bollywood blockbuster
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold/20 via-gold/30 to-amber-400/20 border border-gold/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold hover:border-gold/70 hover:from-gold/30 transition-all shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              >
                <Film className="h-3.5 w-3.5" />
                Make my drama
              </Link>
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}