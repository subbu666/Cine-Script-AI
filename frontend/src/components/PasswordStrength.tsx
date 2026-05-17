import { useMemo } from "react";

interface Props { password: string; }

interface Check { label: string; ok: boolean; }

function evaluate(pw: string) {
  const checks: Check[] = [
    { label: "8+ characters", ok: pw.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "Lowercase letter", ok: /[a-z]/.test(pw) },
    { label: "Number", ok: /\d/.test(pw) },
    { label: "Symbol", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  let score = checks.filter((c) => c.ok).length; // 0..5
  if (pw.length >= 12) score = Math.min(5, score + 1);
  if (/(.)\1{2,}/.test(pw)) score = Math.max(0, score - 1); // repeats
  if (/^(?:password|qwerty|123456|admin|letmein)/i.test(pw)) score = 1;
  return { score, checks };
}

const LEVELS = [
  { label: "Too weak", color: "from-red-600 to-red-400", text: "text-red-400" },
  { label: "Weak",     color: "from-red-500 to-orange-400", text: "text-orange-400" },
  { label: "Fair",     color: "from-orange-400 to-yellow-400", text: "text-yellow-400" },
  { label: "Good",     color: "from-yellow-400 to-lime-400", text: "text-lime-400" },
  { label: "Strong",   color: "from-lime-400 to-emerald-400", text: "text-emerald-400" },
  { label: "Excellent",color: "from-emerald-400 to-[#FFD700]", text: "text-gold" },
];

export function PasswordStrength({ password }: Props) {
  const { score, checks } = useMemo(() => evaluate(password), [password]);
  if (!password) return null;
  const level = LEVELS[score];
  const pct = ((score) / 5) * 100;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
          <div
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${level.color} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${level.text}`}>
          {level.label}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`flex h-3 w-3 items-center justify-center rounded-full transition ${
                c.ok ? "bg-emerald-400/20 text-emerald-400" : "bg-white/5 text-muted-foreground"
              }`}
            >
              {c.ok ? "✓" : "·"}
            </span>
            <span className={c.ok ? "text-foreground/80" : "text-muted-foreground"}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function isPasswordAcceptable(pw: string) {
  return evaluate(pw).score >= 3;
}
