import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
 *  Sub-components
 * ───────────────────────────────────────────────────────────── */

/** L-shaped gold corner bracket — cinematic viewfinder feel */
function FilmCorner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute h-6 w-6 pointer-events-none";
  const horiz = "absolute h-[1.5px] w-full bg-gradient-to-r from-gold/70 to-transparent";
  const vert = "absolute w-[1.5px] h-full bg-gradient-to-b from-gold/70 to-transparent";

  const pos2cls: Record<string, string> = {
    tl: "top-3 left-3",
    tr: "top-3 right-3 scale-x-[-1]",
    bl: "bottom-3 left-3 scale-y-[-1]",
    br: "bottom-3 right-3 scale-[-1]",
  };

  return (
    <motion.div
      className={`${base} ${pos2cls[pos]}`}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.35 }}
    >
      <div className={horiz} />
      <div className={vert} />
    </motion.div>
  );
}

/** Expanding ring pulse — radiates from the icon */
function PulseRing({ delay }: { delay: number }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-[-4px] rounded-full border border-gold/50"
      initial={{ scale: 1, opacity: 0.7 }}
      animate={{ scale: 2.2, opacity: 0 }}
      transition={{ duration: 2, delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

/** Rising gold dust particle */
const PARTICLES = [
  { x: "6%", size: 3, delay: 0, dur: 2.4, drift: -8 },
  { x: "16%", size: 5, delay: 0.55, dur: 2.9, drift: 7 },
  { x: "28%", size: 4, delay: 1.1, dur: 2.6, drift: -14 },
  { x: "40%", size: 7, delay: 0.25, dur: 3.1, drift: 5 },
  { x: "52%", size: 3, delay: 0.85, dur: 2.3, drift: -6 },
  { x: "63%", size: 6, delay: 1.4, dur: 2.8, drift: 12 },
  { x: "75%", size: 4, delay: 0.4, dur: 2.5, drift: -10 },
  { x: "85%", size: 5, delay: 1.0, dur: 2.7, drift: 9 },
  { x: "93%", size: 3, delay: 0.7, dur: 2.2, drift: -5 },
  { x: "33%", size: 5, delay: 1.7, dur: 3.0, drift: 4 },
  { x: "58%", size: 4, delay: 0.15, dur: 2.6, drift: -9 },
];

function GoldDust({ x, size, delay, dur, drift }: (typeof PARTICLES)[0]) {
  return (
    <motion.span
      aria-hidden
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 0.9, 0],
        scale: [0, 1, 0.4],
        y: [0, -70],
        x: [0, drift],
      }}
      transition={{
        duration: dur,
        delay,
        repeat: Infinity,
        repeatDelay: 1.2,
        ease: "easeOut",
      }}
      style={{ left: x, bottom: "0%", width: size, height: size }}
      className="pointer-events-none absolute rounded-full bg-gold blur-[1px]"
    />
  );
}

/** Word-by-word animated title */
function AnimatedTitle({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <motion.h2
      id="confirm-title"
      className="text-center font-display text-2xl font-bold tracking-wide text-foreground"
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.18 + i * 0.07, duration: 0.4, ease: "easeOut" }}
        >
          {word}
          {i < words.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </motion.h2>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  Main component
 * ───────────────────────────────────────────────────────────── */

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel, onConfirm]);

  useEffect(() => {
    if (open) setTimeout(() => confirmRef.current?.focus(), 150);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop with radial vignette ────────────────── */}
          <motion.div
            key="cd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] backdrop-blur-lg"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.92) 100%)",
            }}
            onClick={onCancel}
          />

          {/* ── Dialog ───────────────────────────────────────── */}
          <motion.div
            key="cd-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            initial={{ opacity: 0, scale: 0.82, y: 32, rotateX: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            style={{ perspective: 1000 }}
            className="fixed left-1/2 top-1/2 z-[70] w-full max-w-sm -translate-x-1/2 -translate-y-1/2"
          >
            {/* ── Rotating conic gradient border sweep ─────────
                Technique: outer div rotates a conic gradient;
                inner div has bg-[#0A0A0A] with m-[1px] to show
                only the border edge. Creates an orbiting glow.     */}
            <div className="relative rounded-3xl p-[1px]">
              {/* Rotating light sweep */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-3xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 55%, rgba(201,162,39,0.15) 68%, rgba(255,215,0,0.55) 78%, rgba(201,162,39,0.15) 88%, transparent 100%)",
                }}
              />

              {/* Static dim border beneath */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-3xl border border-gold/12"
              />

              {/* ── Inner card ─────────────────────────────────── */}
              <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-[#0A0A0A]">
                {/* Grain texture overlay */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-0 opacity-[0.035] mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                    backgroundSize: "180px",
                  }}
                />

                {/* Multi-layer ambient glows */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gold/12 blur-[40px]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-10 left-1/3  h-32 w-32 rounded-full bg-[#C9A227]/8 blur-[30px]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-6  right-1/4 h-24 w-24 rounded-full bg-[#FFD700]/6 blur-[24px]"
                />

                {/* Rising gold dust particles */}
                {PARTICLES.map((p, i) => (
                  <GoldDust key={i} {...p} />
                ))}

                {/* Film corner brackets */}
                <FilmCorner pos="tl" />
                <FilmCorner pos="tr" />
                <FilmCorner pos="bl" />
                <FilmCorner pos="br" />

                {/* Top shimmer line */}
                <div
                  aria-hidden
                  className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-gold/70 to-transparent"
                />

                {/* ── Content ──────────────────────────────────── */}
                <div className="relative z-10 px-8 pb-9 pt-10">
                  {/* ── Icon with pulse rings ───────────────────── */}
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12, stiffness: 280, delay: 0.08 }}
                    className="relative mx-auto mb-7 flex h-16 w-16 items-center justify-center"
                  >
                    {/* Pulse rings */}
                    <PulseRing delay={0.2} />
                    <PulseRing delay={0.7} />
                    <PulseRing delay={1.25} />

                    {/* Icon circle */}
                    <div className="relative flex h-full w-full items-center justify-center rounded-full border border-gold/25 bg-gradient-to-br from-gold/10 via-gold/5 to-transparent shadow-[0_0_24px_rgba(201,162,39,0.15)]">
                      <AlertTriangle className="h-7 w-7 text-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
                    </div>
                  </motion.div>

                  {/* ── Title — word-by-word blur reveal ─────────── */}
                  <AnimatedTitle text={title} />

                  {/* ── Description ──────────────────────────────── */}
                  <motion.p
                    id="confirm-desc"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.38, duration: 0.4 }}
                    className="mt-3 text-center text-sm leading-relaxed text-muted-foreground"
                  >
                    {description}
                  </motion.p>

                  {/* ── Ornamental divider ────────────────────────── */}
                  <div className="my-7 flex items-center gap-3">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.42, duration: 0.5, ease: "easeOut" }}
                      className="h-px flex-1 origin-left bg-gradient-to-r from-transparent to-gold/20"
                    />
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.54, type: "spring", stiffness: 300 }}
                      className="text-[10px] text-gold/30"
                    >
                      ✦
                    </motion.span>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.42, duration: 0.5, ease: "easeOut" }}
                      className="h-px flex-1 origin-right bg-gradient-to-l from-transparent to-gold/20"
                    />
                  </div>

                  {/* ── Buttons ───────────────────────────────────── */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.46 }}
                    className="flex flex-col gap-3 sm:flex-row-reverse"
                  >
                    {/* CONFIRM — destructive */}
                    <motion.button
                      ref={confirmRef}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={onConfirm}
                      className={[
                        "group relative flex-1 overflow-hidden rounded-full py-3",
                        "border border-red-500/35 bg-red-500/8",
                        "text-sm font-semibold uppercase tracking-[0.18em] text-red-400",
                        "shadow-[0_0_0_0_rgba(239,68,68,0)] transition-all duration-300",
                        "hover:border-red-400/55 hover:bg-red-500/15 hover:text-red-300",
                        "hover:shadow-[0_0_20px_rgba(239,68,68,0.12)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40",
                      ].join(" ")}
                    >
                      {/* Sweep shimmer */}
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-red-400/12 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.55, ease: "easeInOut" }}
                      />
                      {confirmLabel}
                    </motion.button>

                    {/* CANCEL — gold ghost */}
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={onCancel}
                      className={[
                        "group relative flex-1 overflow-hidden rounded-full py-3",
                        "border border-gold/20 bg-transparent",
                        "text-sm font-medium uppercase tracking-[0.18em] text-gold/60",
                        "transition-all duration-300",
                        "hover:border-gold/40 hover:bg-gold/5 hover:text-gold",
                        "hover:shadow-[0_0_16px_rgba(201,162,39,0.08)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/25",
                      ].join(" ")}
                    >
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-gold/8 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.55, ease: "easeInOut" }}
                      />
                      Cancel
                    </motion.button>
                  </motion.div>

                  {/* ── Keyboard hint — styled like a film credit ── */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.65 }}
                    className="mt-6 text-center text-[9px] uppercase tracking-[0.3em] text-muted-foreground/30"
                  >
                    ↵ confirm &nbsp;·&nbsp; esc cancel
                  </motion.p>
                </div>

                {/* Bottom shimmer line */}
                <div
                  aria-hidden
                  className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-gold/25 to-transparent"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
