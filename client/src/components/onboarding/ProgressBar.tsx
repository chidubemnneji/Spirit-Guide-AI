interface ProgressBarProps { currentPhase: number; totalPhases: number; }

const stepLabels = ["Your story", "Tell us more", "Your goals", "Create account"];

export function ProgressBar({ currentPhase, totalPhases }: ProgressBarProps) {
  const pct = ((currentPhase - 1) / (totalPhases - 1)) * 100;
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--app-white)] border-b border-[var(--app-border)]">
      <div className="flex items-center justify-between px-6 py-5">
        <h1 className="font-serif text-[22px] leading-none text-[var(--app-dark)] tracking-wide">SoulGuide</h1>
        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--app-gray-lt)]">
          {stepLabels[currentPhase - 1] ?? `Step ${currentPhase}`}
        </span>
      </div>
      <div className="h-0.5 bg-[var(--app-border-soft)]">
        <div className="h-full bg-[var(--app-green)] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
