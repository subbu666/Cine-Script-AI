import { motion } from "framer-motion";
import type { Character } from "@/lib/mockScript";

export function CharacterCard({ character, index }: { character: Character; index: number }) {
  const initials = character.name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl glass p-5 transition-all duration-500 hover:border-gold/40 hover:shadow-gold-sm"
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100 opacity-0" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gold-gradient font-display text-lg font-bold text-black shadow-gold-sm">
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-foreground">{character.name}</h3>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{character.role}</p>
        </div>
      </div>
      <p className="relative mt-4 text-sm leading-relaxed text-muted-foreground">{character.description}</p>
    </motion.div>
  );
}
