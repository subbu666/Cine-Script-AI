import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clapperboard, Star } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  name: string; // full name from user object
  onClose: () => void;
}

// Extract first name for a personal feel
function firstName(full: string) {
  return full.split(" ")[0] ?? full;
}

// A single spotlight ray
function SpotlightRay({ angle, delay }: { angle: number; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: [0, 0.18, 0.08, 0.14, 0], scaleY: [0, 1, 1, 1, 0] }}
      transition={{ duration: 3.5, delay, ease: "easeOut" }}
      style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transformOrigin: "top center",
        transform: `translateX(-50%) rotate(${angle}deg)`,
        width: "2px",
        height: "320px",
        background: "linear-gradient(to bottom, rgba(255,215,0,0.9), transparent)",
        filter: "blur(6px)",
        pointerEvents: "none",
      }}
    />
  );
}

// Film strip hole
function FilmHole({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 10,
        height: 14,
        borderRadius: 3,
        background: "rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,215,0,0.12)",
      }}
    />
  );
}

export function WelcomeModal({ open, name, onClose }: WelcomeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [countdownDone, setCountdownDone] = useState(false);
  const [counter, setCounter] = useState(3);

  // Auto-close after 5 s
  useEffect(() => {
    if (!open) {
      setCounter(3);
      setCountdownDone(false);
      return;
    }
    const t = setTimeout(onClose, 5200);
    return () => clearTimeout(t);
  }, [open, onClose]);

  // Countdown 3 → 2 → 1 → "Action!"
  useEffect(() => {
    if (!open) return;
    setCounter(3);
    setCountdownDone(false);
    const intervals = [
      setTimeout(() => setCounter(2), 800),
      setTimeout(() => setCounter(1), 1600),
      setTimeout(() => {
        setCountdownDone(true);
      }, 2400),
    ];
    return () => intervals.forEach(clearTimeout);
  }, [open]);

  // Particle canvas — gold confetti burst
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth || 480;
    canvas.height = canvas.offsetHeight || 540;

    const W = canvas.width;
    const H = canvas.height;

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      color: string;
      spin: number;
      angle: number;
      shape: "circle" | "star" | "rect";
    };

    const COLORS = ["#FFD700", "#C9A227", "#FFF0A0", "#FFB700", "#FFFACD"];

    const particles: Particle[] = Array.from({ length: 90 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 60,
      y: H * 0.3,
      vx: (Math.random() - 0.5) * 7,
      vy: -(Math.random() * 6 + 2),
      r: Math.random() * 4 + 1.5,
      alpha: 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      spin: (Math.random() - 0.5) * 0.3,
      angle: Math.random() * Math.PI * 2,
      shape: (["circle", "star", "rect"] as const)[Math.floor(Math.random() * 3)],
    }));

    // Twinkling bg stars
    const stars = Array.from({ length: 50 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.0 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.003,
    }));

    let t = 0;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, W, H);
      t += 0.016;

      // Stars
      for (const s of stars) {
        const a = 0.1 + 0.55 * Math.abs(Math.sin(s.phase + t * s.speed * 40));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,215,0,${a.toFixed(2)})`;
        ctx.fill();
      }

      // Confetti
      let alive = false;
      for (const p of particles) {
        if (p.alpha <= 0) continue;
        alive = true;
        p.vy += 0.12; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.alpha = Math.max(0, p.alpha - 0.008);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        } else {
          // Simple 4-point star
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            const b = a + Math.PI / 4;
            ctx.lineTo(Math.cos(a) * p.r * 1.8, Math.sin(a) * p.r * 1.8);
            ctx.lineTo(Math.cos(b) * p.r * 0.6, Math.sin(b) * p.r * 0.6);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [open]);

  const rays = [-30, -15, 0, 15, 30];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="wb"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 52,
              background:
                "radial-gradient(ellipse at 50% 35%, rgba(201,162,39,0.11) 0%, rgba(0,0,0,0.92) 65%)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          />

          {/* Modal */}
          <motion.div
            key="wm"
            initial={{ opacity: 0, scale: 0.82, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 53,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              pointerEvents: "none",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                pointerEvents: "auto",
                position: "relative",
                width: "100%",
                maxWidth: "480px",
                borderRadius: "32px",
                background: "linear-gradient(160deg, #13100A 0%, #0A0A0A 50%, #0E0B03 100%)",
                border: "1px solid rgba(201,162,39,0.28)",
                overflow: "hidden",
                boxShadow:
                  "0 0 0 1px rgba(255,215,0,0.05), 0 50px 120px rgba(0,0,0,0.9), 0 0 180px rgba(201,162,39,0.1)",
              }}
            >
              {/* Canvas — stars + confetti */}
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              />

              {/* Spotlight rays */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  overflow: "hidden",
                  height: 320,
                  pointerEvents: "none",
                }}
              >
                {rays.map((angle, i) => (
                  <SpotlightRay key={i} angle={angle} delay={0.3 + i * 0.08} />
                ))}
              </div>

              {/* Sweeping top shimmer */}
              <motion.div
                animate={{ x: ["-100%", "220%"] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,215,0,0.95), transparent)",
                  pointerEvents: "none",
                }}
              />

              {/* Film strip — left edge */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 28,
                  background: "rgba(0,0,0,0.5)",
                  borderRight: "1px solid rgba(255,215,0,0.1)",
                  pointerEvents: "none",
                }}
              >
                {[40, 72, 104, 136, 168, 200, 232, 264, 296, 328, 360, 392].map((y, i) => (
                  <FilmHole key={i} x={9} y={y} />
                ))}
              </div>

              {/* Film strip — right edge */}
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 28,
                  background: "rgba(0,0,0,0.5)",
                  borderLeft: "1px solid rgba(255,215,0,0.1)",
                  pointerEvents: "none",
                }}
              >
                {[56, 88, 120, 152, 184, 216, 248, 280, 312, 344, 376, 408].map((y, i) => (
                  <FilmHole key={i} x={9} y={y} />
                ))}
              </div>

              {/* Deep radial glow */}
              <div
                style={{
                  position: "absolute",
                  top: -50,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 300,
                  height: 300,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,215,0,0.14) 0%, transparent 68%)",
                  pointerEvents: "none",
                }}
              />

              {/* Content */}
              <div
                style={{
                  position: "relative",
                  padding: "2.75rem 3rem 2.25rem",
                  textAlign: "center",
                }}
              >
                {/* Clapperboard icon with pulse */}
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 0px 0px rgba(255,215,0,0)",
                      "0 0 32px 10px rgba(255,215,0,0.38)",
                      "0 0 0px 0px rgba(255,215,0,0)",
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 72,
                    height: 72,
                    borderRadius: "22px",
                    background:
                      "linear-gradient(135deg, rgba(201,162,39,0.30), rgba(255,215,0,0.10))",
                    border: "1px solid rgba(201,162,39,0.40)",
                    marginBottom: "1.5rem",
                  }}
                >
                  <motion.div
                    initial={{ rotate: -20 }}
                    animate={{ rotate: [-20, 0, -8, 0] }}
                    transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                  >
                    <Clapperboard style={{ width: 32, height: 32, color: "#FFD700" }} />
                  </motion.div>
                </motion.div>

                {/* Countdown / "Action!" */}
                <div
                  style={{
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {!countdownDone ? (
                      <motion.span
                        key={counter}
                        initial={{ opacity: 0, scale: 1.6, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.6, y: 10 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: "3rem",
                          fontWeight: 700,
                          color: "#FFD700",
                          lineHeight: 1,
                          textShadow: "0 0 30px rgba(255,215,0,0.7)",
                        }}
                      >
                        {counter}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="action"
                        initial={{ opacity: 0, scale: 0.7, letterSpacing: "0.5em" }}
                        animate={{ opacity: 1, scale: 1, letterSpacing: "0.25em" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: "1.5rem",
                          fontWeight: 700,
                          letterSpacing: "0.25em",
                          textTransform: "uppercase",
                          background:
                            "linear-gradient(90deg, #C9A227, #FFD700, #FFF5C0, #FFD700, #C9A227)",
                          backgroundSize: "300% 100%",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        Action!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Eyebrow */}
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: "rgba(201,162,39,0.65)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Welcome back
                </motion.p>

                {/* Name headline */}
                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 }}
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(2rem, 6vw, 2.75rem)",
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: "#ffffff",
                    marginBottom: "0.6rem",
                  }}
                >
                  Lights on,{" "}
                  <motion.span
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                    style={{
                      background:
                        "linear-gradient(90deg, #C9A227, #FFD700, #FFF5C0, #FFD700, #C9A227)",
                      backgroundSize: "300% 100%",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      display: "inline-block",
                    }}
                  >
                    {firstName(name)}.
                  </motion.span>
                </motion.h2>

                {/* Sub-line */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.42 }}
                  style={{
                    fontSize: "0.9rem",
                    color: "rgba(255,255,255,0.42)",
                    lineHeight: 1.65,
                    marginBottom: "1.75rem",
                  }}
                >
                  The studio is yours. Your stories are waiting.
                  <br />
                  Let's make something unforgettable.
                </motion.p>

                {/* Star row */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "0.4rem",
                    marginBottom: "1.75rem",
                  }}
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 + i * 0.07 }}
                    >
                      <Star
                        style={{
                          width: 16,
                          height: 16,
                          color: "#FFD700",
                          fill: "#FFD700",
                          filter: "drop-shadow(0 0 4px rgba(255,215,0,0.7))",
                        }}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.58 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    width: "100%",
                    padding: "0.9rem 1.5rem",
                    borderRadius: "9999px",
                    background: "linear-gradient(90deg, #B8901F, #FFD700, #C9A227)",
                    border: "none",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#000",
                    cursor: "pointer",
                    overflow: "hidden",
                    boxShadow: "0 0 40px rgba(255,215,0,0.30), 0 6px 24px rgba(0,0,0,0.5)",
                  }}
                >
                  {/* Shimmer sweep */}
                  <motion.span
                    animate={{ x: ["-130%", "230%"] }}
                    transition={{
                      duration: 2.0,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "easeInOut",
                    }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                      pointerEvents: "none",
                    }}
                  />
                  <Clapperboard style={{ width: 16, height: 16 }} />
                  Start creating
                </motion.button>

                {/* Auto-close hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  style={{
                    marginTop: "1rem",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.18)",
                  }}
                >
                  Closes automatically in a few seconds
                </motion.p>
              </div>

              {/* Pulsing bottom border */}
              <motion.div
                animate={{ opacity: [0.2, 0.65, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,215,0,0.6), transparent)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
