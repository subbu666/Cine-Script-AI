import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Film, X, Sparkles, UserPlus } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

// Floating gold particle
function Particle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 0 }}
      animate={{
        y: [0, -60, -130],
        opacity: [0, 0.9, 0],
        x: [x, x + 18, x - 12],
      }}
      transition={{
        duration: 3.5 + Math.random() * 2,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3,
        ease: "easeOut",
      }}
      style={{
        position: "absolute",
        bottom: 0,
        width: size,
        height: size,
        borderRadius: "50%",
        background: "radial-gradient(circle, #FFD700, #C9A227)",
        filter: "blur(0.5px)",
        pointerEvents: "none",
      }}
    />
  );
}

// Orbiting ring with a glowing dot
function OrbitRing({
  radius,
  duration,
  delay,
  dotSize = 4,
}: {
  radius: number;
  duration: number;
  delay: number;
  dotSize?: number;
}) {
  return (
    <motion.div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: radius * 2,
        height: radius * 2,
        marginTop: -radius,
        marginLeft: -radius,
        borderRadius: "50%",
        border: "1px solid rgba(201,162,39,0.13)",
        pointerEvents: "none",
      }}
      animate={{ rotate: 360 }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      <div
        style={{
          position: "absolute",
          top: -dotSize / 2,
          left: "50%",
          marginLeft: -dotSize / 2,
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: "#FFD700",
          boxShadow: `0 0 ${dotSize * 3}px ${dotSize}px rgba(255,215,0,0.55)`,
        }}
      />
    </motion.div>
  );
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Twinkling starfield on canvas
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth || 420;
    canvas.height = canvas.offsetHeight || 520;

    const stars = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.1 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.007 + 0.003,
    }));

    let t = 0;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.016;
      for (const s of stars) {
        const alpha = 0.12 + 0.65 * Math.abs(Math.sin(s.phase + t * s.speed * 40));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,215,0,${alpha.toFixed(2)})`;
        ctx.fill();
      }
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape key close
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const particles = [
    { delay: 0, x: 60, size: 3 },
    { delay: 0.6, x: 120, size: 2 },
    { delay: 1.1, x: 200, size: 3.5 },
    { delay: 1.7, x: 280, size: 2 },
    { delay: 0.3, x: 340, size: 2.5 },
    { delay: 2.0, x: 90, size: 2 },
    { delay: 1.4, x: 260, size: 3 },
    { delay: 0.9, x: 380, size: 2 },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background:
                "radial-gradient(ellipse at 50% 38%, rgba(201,162,39,0.09) 0%, rgba(0,0,0,0.88) 68%)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.86, y: 36 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.91, y: 24 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 51,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "420px",
                borderRadius: "28px",
                background: "linear-gradient(160deg, #111008 0%, #0A0A0A 55%, #0C0A02 100%)",
                border: "1px solid rgba(201,162,39,0.22)",
                overflow: "hidden",
                boxShadow:
                  "0 0 0 1px rgba(255,215,0,0.04), 0 40px 100px rgba(0,0,0,0.85), 0 0 140px rgba(201,162,39,0.07)",
              }}
            >
              {/* Starfield canvas */}
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0.55,
                  pointerEvents: "none",
                }}
              />

              {/* Sweeping shimmer line along top edge */}
              <motion.div
                animate={{ x: ["-100%", "220%"] }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  repeatDelay: 2.5,
                  ease: "easeInOut",
                }}
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

              {/* Three orbiting rings centred behind the icon */}
              <div
                style={{
                  position: "absolute",
                  top: 76,
                  left: "50%",
                  marginLeft: -60,
                  width: 120,
                  height: 120,
                  pointerEvents: "none",
                }}
              >
                <OrbitRing radius={52} duration={9} delay={0} dotSize={3} />
                <OrbitRing radius={74} duration={15} delay={-4} dotSize={2} />
                <OrbitRing radius={98} duration={22} delay={-9} dotSize={2} />
              </div>

              {/* Particles rising from bottom */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  pointerEvents: "none",
                }}
              >
                {particles.map((p, i) => (
                  <Particle key={i} {...p} />
                ))}
              </div>

              {/* Deep radial glow behind icon */}
              <div
                style={{
                  position: "absolute",
                  top: -40,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 260,
                  height: 260,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,215,0,0.13) 0%, transparent 68%)",
                  pointerEvents: "none",
                }}
              />

              {/* Corner vignettes */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 70,
                  height: 70,
                  background: "linear-gradient(135deg, rgba(255,215,0,0.07), transparent)",
                  borderRadius: "28px 0 0 0",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 70,
                  height: 70,
                  background: "linear-gradient(315deg, rgba(255,215,0,0.05), transparent)",
                  borderRadius: "0 0 28px 0",
                  pointerEvents: "none",
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.45)",
                  cursor: "pointer",
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(201,162,39,0.45)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#FFD700";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.1)";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>

              {/* ── Content ── */}
              <div
                style={{
                  position: "relative",
                  padding: "2.75rem 2rem 2.25rem",
                  textAlign: "center",
                }}
              >
                {/* Pulsing film icon */}
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 0px 0px rgba(255,215,0,0)",
                      "0 0 28px 8px rgba(255,215,0,0.32)",
                      "0 0 0px 0px rgba(255,215,0,0)",
                    ],
                  }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 68,
                    height: 68,
                    borderRadius: "20px",
                    background:
                      "linear-gradient(135deg, rgba(201,162,39,0.28), rgba(255,215,0,0.08))",
                    border: "1px solid rgba(201,162,39,0.38)",
                    marginBottom: "1.5rem",
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, -7, 7, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Film style={{ width: 30, height: 30, color: "#FFD700" }} />
                  </motion.div>
                </motion.div>

                {/* Eyebrow label */}
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: "rgba(201,162,39,0.65)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Members only
                </motion.p>

                {/* Headline */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(1.85rem, 5vw, 2.35rem)",
                    fontWeight: 700,
                    lineHeight: 1.18,
                    color: "#ffffff",
                    marginBottom: "0.85rem",
                  }}
                >
                  Your story deserves
                  <br />
                  {/* Animated shimmer gradient text */}
                  <motion.span
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
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
                    an audience.
                  </motion.span>
                </motion.h2>

                {/* Sub-text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.32 }}
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.4)",
                    lineHeight: 1.65,
                    marginBottom: "1.6rem",
                  }}
                >
                  Sign in to generate scripts, save your history,
                  <br />
                  and build your Bollywood universe.
                </motion.p>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.38, duration: 0.55 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "1.4rem",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      background: "rgba(255,255,255,0.06)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.18)",
                    }}
                  >
                    lights · camera · action
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      background: "rgba(255,255,255,0.06)",
                    }}
                  />
                </motion.div>

                {/* Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42 }}
                  style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}
                >
                  {/* Primary — Sign in */}
                  <motion.button
                    whileHover={{ scale: 1.025 }}
                    whileTap={{ scale: 0.965 }}
                    onClick={() => {
                      onClose();
                      navigate({ to: "/login" });
                    }}
                    style={{
                      position: "relative",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      width: "100%",
                      padding: "0.85rem 1.5rem",
                      borderRadius: "9999px",
                      background: "linear-gradient(90deg, #B8901F, #FFD700, #C9A227)",
                      backgroundSize: "200% 100%",
                      border: "none",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#000000",
                      cursor: "pointer",
                      overflow: "hidden",
                      boxShadow: "0 0 36px rgba(255,215,0,0.28), 0 6px 20px rgba(0,0,0,0.5)",
                    }}
                  >
                    {/* Button shimmer sweep */}
                    <motion.span
                      animate={{ x: ["-130%", "230%"] }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        repeatDelay: 1.8,
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
                    <Sparkles style={{ width: 16, height: 16 }} />
                    Sign in to generate
                  </motion.button>

                  {/* Secondary — Sign up */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.965 }}
                    onClick={() => {
                      onClose();
                      navigate({ to: "/signup" });
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      width: "100%",
                      padding: "0.85rem 1.5rem",
                      borderRadius: "9999px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.7)",
                      cursor: "pointer",
                    }}
                  >
                    <UserPlus style={{ width: 16, height: 16 }} />
                    Create free account
                  </motion.button>
                </motion.div>

                {/* Footer note */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.58 }}
                  style={{
                    marginTop: "1.25rem",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.18)",
                  }}
                >
                  Free forever · No credit card required
                </motion.p>
              </div>

              {/* Pulsing bottom border */}
              <motion.div
                animate={{ opacity: [0.25, 0.65, 0.25] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,215,0,0.55), transparent)",
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
