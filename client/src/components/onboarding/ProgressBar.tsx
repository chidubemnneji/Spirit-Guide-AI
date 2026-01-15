import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentPhase: number;
  totalPhases: number;
}

export function ProgressBar({ currentPhase, totalPhases }: ProgressBarProps) {
  const progress = (currentPhase / totalPhases) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-2xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Step {currentPhase} of {totalPhases}
          </span>
          <div className="flex gap-2">
            {Array.from({ length: totalPhases }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  i + 1 <= currentPhase
                    ? "bg-primary"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
