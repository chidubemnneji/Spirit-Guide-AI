import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type Mood = "anxious" | "sad" | "stressed" | "hopeful" | "joyful";

interface MoodOption {
  id: Mood;
  emoji: string;
  label: string;
  color: string;
  selectedColor: string;
}

const MOODS: MoodOption[] = [
  { id: "anxious",  emoji: "😟", label: "Anxious",  color: "bg-amber-50 dark:bg-amber-950/30",  selectedColor: "bg-amber-100 border-amber-400 dark:bg-amber-900/50" },
  { id: "sad",      emoji: "😔", label: "Sad",      color: "bg-blue-50 dark:bg-blue-950/30",    selectedColor: "bg-blue-100 border-blue-400 dark:bg-blue-900/50" },
  { id: "stressed", emoji: "😩", label: "Stressed", color: "bg-red-50 dark:bg-red-950/30",      selectedColor: "bg-red-100 border-red-400 dark:bg-red-900/50" },
  { id: "hopeful",  emoji: "🙏", label: "Hopeful",  color: "bg-purple-50 dark:bg-purple-950/30", selectedColor: "bg-purple-100 border-purple-400 dark:bg-purple-900/50" },
  { id: "joyful",   emoji: "😊", label: "Grateful", color: "bg-green-50 dark:bg-green-950/30",  selectedColor: "bg-green-100 border-green-400 dark:bg-green-900/50" },
];

interface MoodCheckInProps {
  visible: boolean;
  onSelect: (mood: Mood) => void;
  onSkip: () => void;
}

export function MoodCheckIn({ visible, onSelect, onSkip }: MoodCheckInProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="px-1 pb-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
        >
          <div className="bg-card border border-border/60 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">
                How are you feeling right now?
              </p>
              <button
                onClick={onSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-skip-mood"
              >
                Skip
              </button>
            </div>

            <div className="flex gap-2 justify-between">
              {MOODS.map((mood, i) => (
                <motion.button
                  key={mood.id}
                  onClick={() => onSelect(mood.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border border-transparent transition-all",
                    mood.color,
                    "hover:border-border/50"
                  )}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.94 }}
                  data-testid={`button-mood-${mood.id}`}
                >
                  <span style={{ fontSize: 22 }}>{mood.emoji}</span>
                  <span className="text-[10px] font-medium text-foreground/70">{mood.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
