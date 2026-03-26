import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentPhase: number;
  totalPhases: number;
}

const stepLabels = ["Your story", "Tell us more", "Your goals", "Create account"];

export function ProgressBar({ currentPhase, totalPhases }: ProgressBarProps) {
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-lg mx-auto px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            {stepLabels[currentPhase - 1] ?? `Step ${currentPhase}`}
          </span>
          <span className="text-xs text-muted-foreground/60">
            {currentPhase} / {totalPhases}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: totalPhases }, (_, i) => (
            <motion.div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-500",
                i + 1 < currentPhase
                  ? "bg-primary/50"
                  : i + 1 === currentPhase
                  ? "bg-primary"
                  : "bg-muted"
              )}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
