import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentPhase: number;
  totalPhases: number;
}

export function ProgressBar({ currentPhase, totalPhases }: ProgressBarProps) {
  const progress = (currentPhase / totalPhases) * 100;

  return (
    <motion.div 
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-2xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground tracking-refined">
            Step {currentPhase} of {totalPhases}
          </span>
          <div className="flex gap-2">
            {Array.from({ length: totalPhases }, (_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  i + 1 <= currentPhase
                    ? "gradient-primary shadow-primary"
                    : "bg-muted"
                )}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: i + 1 === currentPhase ? 1.2 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              />
            ))}
          </div>
        </div>
        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
