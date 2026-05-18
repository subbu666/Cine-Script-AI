import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Trash2, Loader2 } from "lucide-react";
import type { Script } from "@/lib/mockScript";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  history: Script[];
  onSelect: (s: Script) => void;
  onDelete: (id: string) => Promise<void>;
  onClear: () => void;
}

type PendingAction = { type: "delete"; id: string; title: string } | { type: "clear" };

export function HistoryPanel({ open, onClose, history, onSelect, onDelete, onClear }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const requestDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (deletingId) return;
    setPending({ type: "delete", id, title });
  };

  const requestClear = () => {
    if (deletingId) return;
    setPending({ type: "clear" });
  };

  const handleConfirm = async () => {
    if (!pending) return;
    setPending(null);
    if (pending.type === "delete") {
      setDeletingId(pending.id);
      try {
        await onDelete(pending.id);
      } finally {
        setDeletingId(null);
      }
    } else {
      onClear();
    }
  };

  const handleCancel = () => setPending(null);

  const dialogTitle = pending?.type === "clear" ? "Clear all history?" : "Delete this script?";
  const dialogDescription =
    pending?.type === "clear"
      ? "Every script in your history will be permanently removed. This cannot be undone."
      : `"${pending?.type === "delete" ? pending.title : ""}" will be permanently deleted. This cannot be undone.`;
  const dialogConfirmLabel = pending?.type === "clear" ? "Clear All" : "Delete";

  return (
    <>
      <ConfirmDialog
        open={pending !== null}
        title={dialogTitle}
        description={dialogDescription}
        confirmLabel={dialogConfirmLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0A0A0A]"
            >
              <header className="flex items-center justify-between border-b border-white/5 px-6 py-5">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gold" />
                  <h2 className="font-display text-xl font-semibold">Past Scripts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                >
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
                    {history.map((s) => {
                      const isDeleting = deletingId === s.id;
                      const anyDeleting = deletingId !== null;
                      return (
                        <motion.li
                          key={s.id}
                          layout
                          exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                          className="group relative"
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => !anyDeleting && onSelect(s)}
                            onKeyDown={(e) => e.key === "Enter" && !anyDeleting && onSelect(s)}
                            className={[
                              "w-full cursor-pointer rounded-2xl glass p-4 text-left transition-all duration-200 pr-11",
                              anyDeleting
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:border-gold/40",
                              isDeleting ? "opacity-40" : "",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h3
                                className={[
                                  "font-display text-lg font-semibold leading-tight text-foreground transition-colors duration-200",
                                  !anyDeleting ? "group-hover:text-gold" : "",
                                ].join(" ")}
                              >
                                {s.title}
                              </h3>
                              <span className="mt-0.5 flex-none rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                                {s.mood}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {s.situation}
                            </p>
                            <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                              {new Date(s.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <button
                            onClick={(e) => requestDelete(e, s.id, s.title)}
                            disabled={anyDeleting}
                            title="Delete this script"
                            className={[
                              "absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200",
                              isDeleting
                                ? "cursor-not-allowed border-gold/10 text-gold/30"
                                : anyDeleting
                                  ? "cursor-not-allowed border-white/5 text-white/10"
                                  : "border-transparent text-white/0 group-hover:border-white/10 group-hover:text-white/30 hover:!border-red-500/30 hover:!bg-red-500/10 hover:!text-red-400",
                            ].join(" ")}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {history.length > 0 && (
                <footer className="border-t border-white/5 p-4">
                  <button
                    onClick={requestClear}
                    disabled={deletingId !== null}
                    className={[
                      "inline-flex w-full items-center justify-center gap-2 rounded-full border py-2.5",
                      "text-xs uppercase tracking-wider transition-colors duration-200",
                      deletingId !== null
                        ? "cursor-not-allowed border-white/5 text-muted-foreground/30"
                        : "border-white/10 text-muted-foreground hover:border-destructive/40 hover:text-destructive",
                    ].join(" ")}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear history
                  </button>
                </footer>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
