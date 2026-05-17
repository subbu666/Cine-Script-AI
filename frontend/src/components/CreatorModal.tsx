import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Linkedin, Globe, X, Sparkles, Code2, Cpu } from "lucide-react";
import { useRef, useEffect, useState, useCallback } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

/* ─── Floating particle ─── */
function GoldParticle({ index }: { index: number }) {
  const angle = (index / 18) * Math.PI * 2;
  const radius = 80 + Math.random() * 60;
  const size = 1.5 + Math.random() * 2.5;
  const duration = 3 + Math.random() * 4;
  const delay = Math.random() * 3;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `rgba(212, 175, 55, ${0.3 + Math.random() * 0.5})`,
        left: "50%",
        top: "50%",
        boxShadow: `0 0 ${size * 3}px rgba(212,175,55,0.6)`,
      }}
      animate={{
        x: [
          Math.cos(angle) * radius * 0.3,
          Math.cos(angle + 0.5) * radius,
          Math.cos(angle + 1.0) * radius * 0.6,
          Math.cos(angle) * radius * 0.3,
        ],
        y: [
          Math.sin(angle) * radius * 0.3,
          Math.sin(angle + 0.5) * radius,
          Math.sin(angle + 1.0) * radius * 0.6,
          Math.sin(angle) * radius * 0.3,
        ],
        opacity: [0, 0.8, 0.4, 0],
        scale: [0, 1, 0.7, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/* ─── Orbiting ring dot ─── */
function OrbitDot({ index, total, radius }: { index: number; total: number; radius: number }) {
  const angle = (index / total) * 360;
  const size = index % 3 === 0 ? 3.5 : 2;
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: index % 3 === 0 ? "rgba(255, 215, 0, 0.9)" : "rgba(212, 175, 55, 0.5)",
        top: "50%",
        left: "50%",
        marginTop: -size / 2,
        marginLeft: -size / 2,
        transformOrigin: `0 0`,
        boxShadow: index % 3 === 0 ? "0 0 6px rgba(255,215,0,0.8)" : "none",
      }}
      animate={{
        rotate: [angle, angle + 360],
        x: [
          Math.cos((angle * Math.PI) / 180) * radius,
          Math.cos(((angle + 360) * Math.PI) / 180) * radius,
        ],
        y: [
          Math.sin((angle * Math.PI) / 180) * radius,
          Math.sin(((angle + 360) * Math.PI) / 180) * radius,
        ],
      }}
      transition={{
        duration: 8 + (index % 3),
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

/* ─── Shimmer scan line ─── */
function ScanLine() {
  return (
    <motion.div
      className="absolute inset-x-0 pointer-events-none"
      style={{
        height: 2,
        background:
          "linear-gradient(90deg, transparent, rgba(212,175,55,0.6), rgba(255,215,0,0.9), rgba(212,175,55,0.6), transparent)",
        zIndex: 20,
        filter: "blur(0.5px)",
      }}
      animate={{ top: ["-2%", "102%"] }}
      transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
    />
  );
}

/* ─── Gold corner accent ─── */
function CornerAccent({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const posStyle = {
    tl: { top: 12, left: 12 },
    tr: { top: 12, right: 12 },
    bl: { bottom: 12, left: 12 },
    br: { bottom: 12, right: 12 },
  }[position];

  const rotations = { tl: 0, tr: 90, bl: 270, br: 180 };

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ ...posStyle, transform: `rotate(${rotations[position]}deg)` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M0 14 L0 0 L14 0"
          stroke="rgba(212,175,55,0.7)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

/* ─── Animated stat badge ─── */
function StatBadge({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-0.5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <span
        className="text-base font-bold"
        style={{
          color: "#D4AF37",
          fontFamily: "'Cormorant Garamond', serif",
          letterSpacing: "0.05em",
        }}
      >
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-widest text-white/30 font-medium">
        {label}
      </span>
    </motion.div>
  );
}

/* ─── Tilt card hook ─── */
function useTilt() {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      x.set((e.clientX - rect.left) / rect.width - 0.5);
      y.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [x, y],
  );

  const onMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { cardRef, rotateX, rotateY, onMouseMove, onMouseLeave };
}

/* ─── Main modal ─── */
export function CreatorModal({ open, onClose }: Props) {
  const { cardRef, rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [glowPulse, setGlowPulse] = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setGlowPulse(true), 800);
      return () => clearTimeout(t);
    } else {
      setGlowPulse(false);
    }
  }, [open]);

  const badges = [
    { icon: Code2, label: "Full Stack" },
    { icon: Cpu, label: "AI / LLMs" },
    { icon: Sparkles, label: "Vibe Coding" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* ── Backdrop with radial gold glow ── */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(212,175,55,0.06) 0%, rgba(0,0,0,0.88) 100%)",
              backdropFilter: "blur(14px)",
            }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* ── 3D tilt card ── */}
          <motion.div
            ref={cardRef}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
              rotateX,
              rotateY,
              perspective: 1000,
              transformStyle: "preserve-3d",
              position: "relative",
              zIndex: 10,
              width: "100%",
              maxWidth: 480,
            }}
            initial={{ opacity: 0, scale: 0.88, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 40 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Card shell */}
            <div
              className="relative overflow-hidden rounded-3xl"
              style={{
                background: "linear-gradient(160deg, #161616 0%, #0C0C0C 50%, #080808 100%)",
                border: "1px solid rgba(212,175,55,0.2)",
                boxShadow: `
                  0 0 0 1px rgba(212,175,55,0.05),
                  0 25px 60px rgba(0,0,0,0.7),
                  0 0 80px rgba(212,175,55,0.07),
                  inset 0 1px 0 rgba(212,175,55,0.12)
                `,
              }}
            >
              {/* Corner accents */}
              <CornerAccent position="tl" />
              <CornerAccent position="tr" />
              <CornerAccent position="bl" />
              <CornerAccent position="br" />

              {/* Scan line */}
              <ScanLine />

              {/* Top gold radial bloom */}
              <div
                className="absolute inset-x-0 top-0 h-48 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.14) 0%, transparent 70%)",
                }}
              />

              {/* Noise grain overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.025]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  backgroundSize: "128px 128px",
                }}
              />

              {/* Diagonal gold line accent */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ opacity: 0.04 }}
              >
                <line x1="0" y1="0" x2="100%" y2="100%" stroke="#D4AF37" strokeWidth="1" />
                <line x1="100%" y1="0" x2="0" y2="100%" stroke="#D4AF37" strokeWidth="1" />
              </svg>

              {/* Close button */}
              <motion.button
                onClick={onClose}
                className="absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                whileHover={{
                  borderColor: "rgba(212,175,55,0.5)",
                  background: "rgba(212,175,55,0.08)",
                  scale: 1.1,
                }}
                whileTap={{ scale: 0.92 }}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.5 }}
              >
                <X className="h-3.5 w-3.5 text-white/40" />
              </motion.button>

              {/* ── Main content ── */}
              <div className="relative z-10 flex flex-col items-center px-8 pb-10 pt-10 text-center">
                {/* Avatar + orbit system */}
                <motion.div
                  className="relative flex items-center justify-center"
                  style={{ width: 180, height: 180 }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Particles */}
                  {Array.from({ length: 18 }).map((_, i) => (
                    <GoldParticle key={i} index={i} />
                  ))}

                  {/* Outer orbit ring */}
                  <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: 166,
                      height: 166,
                      border: "1px dashed rgba(212,175,55,0.15)",
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  />

                  {/* Orbit dots */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <OrbitDot key={i} index={i} total={12} radius={83} />
                  ))}

                  {/* Inner glow ring */}
                  <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: 128,
                      height: 128,
                      background: "transparent",
                      border: "1px solid rgba(212,175,55,0.25)",
                      boxShadow: glowPulse
                        ? "0 0 20px rgba(212,175,55,0.25), inset 0 0 20px rgba(212,175,55,0.1)"
                        : "0 0 0px rgba(212,175,55,0)",
                    }}
                    animate={
                      glowPulse
                        ? {
                            boxShadow: [
                              "0 0 15px rgba(212,175,55,0.2), inset 0 0 15px rgba(212,175,55,0.08)",
                              "0 0 35px rgba(212,175,55,0.45), inset 0 0 30px rgba(212,175,55,0.2)",
                              "0 0 15px rgba(212,175,55,0.2), inset 0 0 15px rgba(212,175,55,0.08)",
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {/* Avatar image */}
                  <div
                    className="relative z-10 overflow-hidden rounded-full"
                    style={{
                      width: 108,
                      height: 108,
                      border: "2px solid rgba(212,175,55,0.45)",
                      boxShadow: "0 0 30px rgba(212,175,55,0.2), 0 0 60px rgba(212,175,55,0.1)",
                    }}
                  >
                    {/* Gold shimmer on image */}
                    <motion.div
                      className="absolute inset-0 z-20 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(135deg, transparent 0%, rgba(255,215,0,0.15) 50%, transparent 100%)",
                      }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{
                        duration: 2.5,
                        delay: 1,
                        repeat: Infinity,
                        repeatDelay: 5,
                        ease: "easeInOut",
                      }}
                    />
                    <img
                      src="https://i.postimg.cc/fbznTS46/Whats-App-Image-2025-06-29-at-08-28-57-f2c6ea81.jpg"
                      alt="Saladi Subrahmanyam"
                      className="h-full w-full object-cover"
                      onLoad={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #1a1a1a, #0f0f0f)" }}
                      >
                        <span
                          style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: 28,
                            fontWeight: 700,
                            background: "linear-gradient(135deg, #C9A227, #FFD700)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          SS
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Floating badge */}
                  <motion.div
                    className="absolute z-20 rounded-full px-3 py-0.5"
                    style={{
                      bottom: 14,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#080808",
                      border: "1px solid rgba(212,175,55,0.35)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.05, borderColor: "rgba(212,175,55,0.7)" }}
                  >
                    <span
                      className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: "#D4AF37" }}
                    >
                      <Sparkles className="h-2.5 w-2.5" style={{ color: "#FFD700" }} />
                      Vibe Coder
                    </span>
                  </motion.div>
                </motion.div>

                {/* Name */}
                <motion.h2
                  className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-white"
                  style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.01em" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  Saladi Subrahmanyam
                </motion.h2>

                {/* Title with animated underline */}
                <motion.div
                  className="relative mt-1.5 flex flex-col items-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-[11px] uppercase tracking-[0.35em] text-white/35 font-medium">
                    Creator of CineScript
                  </p>
                  <motion.div
                    className="mt-1.5 h-px rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, #D4AF37, #FFD700, #D4AF37, transparent)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: 120 }}
                    transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
                  />
                </motion.div>

                {/* Stats row */}
                <motion.div
                  className="mt-5 flex items-center gap-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <StatBadge value="1+" label="Years" delay={0.6} />
                  <div
                    style={{
                      width: 1,
                      height: 28,
                      background:
                        "linear-gradient(180deg, transparent, rgba(212,175,55,0.4), transparent)",
                    }}
                  />
                  <StatBadge value="AI" label="Augmented" delay={0.65} />
                  <div
                    style={{
                      width: 1,
                      height: 28,
                      background:
                        "linear-gradient(180deg, transparent, rgba(212,175,55,0.4), transparent)",
                    }}
                  />
                  <StatBadge value="∞" label="Ideas" delay={0.7} />
                </motion.div>

                {/* Description */}
                <motion.p
                  className="mt-5 max-w-sm text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  AI-Augmented Full Stack Developer skilled in building intelligent web applications
                  by integrating advanced LLMs and modern cloud services. Transforming ideas into
                  production-ready solutions with collaborative AI workflows.
                </motion.p>

                {/* Tech badges */}
                <motion.div
                  className="mt-5 flex flex-wrap items-center justify-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.68 }}
                >
                  {badges.map((b, i) => (
                    <motion.span
                      key={b.label}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
                      style={{
                        background: "rgba(212,175,55,0.06)",
                        border: "1px solid rgba(212,175,55,0.2)",
                        color: "rgba(255,255,255,0.55)",
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + i * 0.08 }}
                      whileHover={{
                        background: "rgba(212,175,55,0.12)",
                        borderColor: "rgba(212,175,55,0.5)",
                        color: "#D4AF37",
                        scale: 1.06,
                        boxShadow: "0 0 12px rgba(212,175,55,0.15)",
                      }}
                    >
                      <b.icon className="h-3 w-3" style={{ color: "rgba(212,175,55,0.75)" }} />
                      {b.label}
                    </motion.span>
                  ))}
                </motion.div>

                {/* Divider */}
                <motion.div
                  className="mt-7 w-full h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(212,175,55,0.15), rgba(212,175,55,0.15), transparent)",
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                />

                {/* CTA buttons */}
                <motion.div
                  className="mt-6 flex items-center gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.82 }}
                >
                  <motion.a
                    href="https://www.linkedin.com/in/saladi-subrahmanyam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white/70"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    whileHover={{
                      background: "rgba(10,102,194,0.15)",
                      borderColor: "rgba(10,102,194,0.5)",
                      color: "#4da6ff",
                      scale: 1.04,
                      boxShadow: "0 0 20px rgba(10,102,194,0.2)",
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </motion.a>

                  <motion.a
                    href="https://saladi-subrahmanyam-portfolio.netlify.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(201,162,39,0.15) 0%, rgba(212,175,55,0.1) 100%)",
                      border: "1px solid rgba(212,175,55,0.4)",
                      color: "#D4AF37",
                      boxShadow:
                        "0 0 20px rgba(212,175,55,0.1), inset 0 1px 0 rgba(212,175,55,0.15)",
                    }}
                    whileHover={{
                      background:
                        "linear-gradient(135deg, rgba(201,162,39,0.28) 0%, rgba(255,215,0,0.18) 100%)",
                      borderColor: "rgba(255,215,0,0.7)",
                      color: "#FFD700",
                      scale: 1.04,
                      boxShadow: "0 0 30px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,215,0,0.2)",
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Globe className="h-4 w-4" />
                    Portfolio
                  </motion.a>
                </motion.div>
              </div>

              {/* Bottom gold shimmer line */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(212,175,55,0.15), rgba(255,215,0,0.5), rgba(212,175,55,0.15), transparent)",
                }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Outer glow halo */}
            <motion.div
              className="absolute -inset-6 rounded-[3rem] pointer-events-none -z-10"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.08) 0%, transparent 70%)",
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
