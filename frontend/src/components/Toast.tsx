import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-destructive/40 bg-black/80 px-4 py-2 text-sm text-destructive shadow-lg backdrop-blur"
        >
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
