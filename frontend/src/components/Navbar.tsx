import { motion } from "framer-motion";
import { Clapperboard, LogOut } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";

export function Navbar({ onHistoryClick }: { onHistoryClick: () => void }) {
  const { user, logout, loading } = useAuth();

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5"
    >
      <Link to="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient shadow-gold">
          <Clapperboard className="h-5 w-5 text-black" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-xl font-semibold text-foreground">CineScript</span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-gold">AI · Bollywood</span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={onHistoryClick}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground transition hover:border-gold/40 hover:text-gold"
        >
          History
        </button>

        {loading ? null : user ? (
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1.5 sm:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-gradient text-[10px] font-bold text-black">
                {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
              </span>
              <span className="text-xs text-foreground">{user.name || user.email}</span>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="rounded-full border border-white/10 bg-white/5 p-2 text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-muted-foreground transition hover:border-gold/40 hover:text-gold"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="hidden rounded-full bg-gold-gradient px-4 py-2 text-xs font-semibold text-black shadow-gold-sm transition hover:scale-105 sm:block"
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  );
}
