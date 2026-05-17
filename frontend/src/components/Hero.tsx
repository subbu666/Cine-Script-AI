import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-6 pb-10 pt-14 text-center sm:pt-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-gold"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
        Now Casting · AI Powered
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="font-display text-5xl font-semibold leading-[1.05] text-foreground sm:text-7xl md:text-8xl"
      >
        Every story deserves a <span className="text-gold-gradient italic">blockbuster</span>.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
      >
        Turn everyday moments into blockbuster drama. <span className="text-gold">🎬</span>
      </motion.p>
    </section>
  );
}
