import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Trash2 } from "lucide-react";
import type { Script } from "@/lib/mockScript";

interface Props {
  open: boolean;
  onClose: () => void;
  history: Script[];
  onSelect: (s: Script) => void;
  onClear: () => void;
}

export function HistoryPanel({ open, onClose, history, onSelect, onClear }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0A0A0A]"
          >
            <header className="flex items-center justify-between border-b border-white/5 px-6 py-5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold" />
                <h2 className="font-display text-xl font-semibold">Past Scripts</h2>
              </div>
              <button onClick={onClose} className="rounded-full p-2 text-muted-foreground transition hover:bg-white/5 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {history.length === 0 ? (
                <div className="mt-20 text-center text-sm text-muted-foreground">
                  Your generated scripts will appear here.
                </div>
              ) : (
                <ul className="space-y-3">
                  {history.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => onSelect(s)}
                        className="group w-full rounded-2xl glass p-4 text-left transition hover:border-gold/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-gold">
                            {s.title}
                          </h3>
                          <span className="rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                            {s.mood}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.situation}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                          {new Date(s.createdAt).toLocaleString()}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {history.length > 0 && (
              <footer className="border-t border-white/5 p-4">
                <button
                  onClick={onClear}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 py-2.5 text-xs uppercase tracking-wider text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear history
                </button>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
