import { motion } from "framer-motion";
import type { Script } from "@/lib/mockScript";
import { CharacterCard } from "./CharacterCard";
import { SceneCard } from "./SceneCard";
import { Film } from "lucide-react";

export function OutputDisplay({ script }: { script: Script }) {
  const characters = script.characters ?? [];
  const scenes = script.scenes ?? [];

  return (
    <section className="relative z-10 mx-auto mt-16 w-full max-w-6xl px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden rounded-3xl glass-gold p-8 sm:p-12 grain"
      >
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-gold">
            <Film className="h-3 w-3" /> {script.mood} · Original Screenplay
          </div>
          <h2 className="font-display text-5xl font-bold leading-tight text-gold-gradient sm:text-7xl">
            {script.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-display text-lg italic text-foreground/80 sm:text-xl">
            "{script.tagline}"
          </p>
        </div>
      </motion.div>

      {characters.length > 0 && (
        <div className="mt-14">
          <SectionHeader eyebrow="The Cast" title="Characters" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {characters.map((c, i) => (
              // FIX: c.name may not be unique; use index as fallback
              <CharacterCard key={c.name ?? i} character={c} index={i} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-16 pb-20">
        <SectionHeader eyebrow="Screenplay" title="Scenes" />
        {scenes.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No scenes were generated. Please try again.
          </p>
        ) : (
          <div className="mt-6 space-y-5">
            {scenes.map((s, i) => (
              // FIX: s.number is undefined on backend docs — use _id, fall back to number, then index
              <SceneCard key={(s as any)._id ?? s.number ?? i} scene={s} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

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
