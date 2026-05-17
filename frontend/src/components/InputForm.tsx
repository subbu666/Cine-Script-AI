import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronDown } from "lucide-react";
import type { Mood } from "@/lib/mockScript";

// FIX: lowercase values so they match backend Joi validation and mockScript Mood type
const MOODS: { value: Mood; label: string }[] = [
  { value: "dramatic", label: "Dramatic Mood" },
  { value: "action", label: "Action Mood" },
  { value: "comedy", label: "Comedy Mood" },
  { value: "romantic", label: "Romantic Mood" },
  { value: "tragic", label: "Tragic Mood" },
];

interface Props {
  onGenerate: (situation: string, mood: Mood) => void;
  loading: boolean;
  initialSituation?: string;
  initialMood?: Mood;
}

export function InputForm({
  onGenerate,
  loading,
  initialSituation = "",
  initialMood = "dramatic", // FIX: lowercase default
}: Props) {
  const [situation, setSituation] = useState(initialSituation);
  const [mood, setMood] = useState<Mood>(initialMood);
  const [focused, setFocused] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!situation.trim() || loading) return;
    onGenerate(situation, mood); // mood is already lowercase — no transform needed
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative mx-auto w-full max-w-3xl"
    >
      <div
        className={`relative rounded-3xl glass p-2 transition-all duration-500 ${
          focused ? "glow-gold border-gold/40" : ""
        }`}
      >
        <textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Describe a moment… 'I missed my train and met a stranger who looked exactly like me.'"
          rows={4}
          className="w-full resize-none rounded-2xl bg-transparent px-5 py-4 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
        <div className="flex flex-col gap-3 border-t border-white/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value as Mood)}
              className="appearance-none rounded-full border border-white/10 bg-white/5 py-2 pl-4 pr-10 text-sm text-foreground transition hover:border-gold/40 focus:border-gold/60 focus:outline-none"
            >
              {/* FIX: value is lowercase, label is human-readable */}
              {MOODS.map(({ value, label }) => (
                <option key={value} value={value} className="bg-background">
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          </div>
          <button
            type="submit"
            disabled={loading || !situation.trim()}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold text-black shadow-gold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Writing the script…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Script
              </>
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
}
