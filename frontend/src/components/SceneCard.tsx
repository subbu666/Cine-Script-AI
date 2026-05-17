import { motion } from "framer-motion";
import type { Scene } from "@/lib/mockScript";

export function SceneCard({ scene, index }: { scene: Scene; index: number }) {
  // FIX: backend may return a different field name or omit dialogues entirely
  const dialogues = scene.dialogues ?? [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-3xl glass p-6 sm:p-8"
    >
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <header className="flex items-center gap-4">
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-gold/30 bg-gold/5 font-display text-lg font-bold text-gold">
          {String(scene.number).padStart(2, "0")}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Scene {scene.number}
          </p>
          <h3 className="font-display text-2xl font-semibold text-foreground">{scene.title}</h3>
        </div>
      </header>
      <p className="mt-5 text-sm italic leading-relaxed text-muted-foreground sm:text-base">
        {scene.description}
      </p>
      <div className="mt-6 space-y-3 border-l-2 border-gold/30 pl-5">
        {dialogues.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">No dialogue for this scene.</p>
        ) : (
          dialogues.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-sm sm:text-base"
            >
              <span className="font-display font-semibold uppercase tracking-wider text-gold">
                {d.character}:
              </span>{" "}
              <span className="text-foreground/90">{d.line}</span>
            </motion.div>
          ))
        )}
      </div>
    </motion.article>
  );
}
