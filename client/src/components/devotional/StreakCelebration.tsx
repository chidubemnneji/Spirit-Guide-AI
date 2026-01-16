import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

interface StreakCelebrationProps {
  visible: boolean;
  milestone: number;
  onClose: () => void;
}

const milestoneMessages: Record<number, { title: string; message: string }> = {
  7: {
    title: "7 Day Streak!",
    message: "You've shown up every day this week. That's building a beautiful habit.",
  },
  14: {
    title: "Two Weeks Strong!",
    message: "14 days of faithfulness. Your consistency is inspiring.",
  },
  30: {
    title: "One Month Milestone!",
    message: "30 days of devotion. You're transforming your spiritual life.",
  },
  60: {
    title: "60 Day Journey!",
    message: "Two months of dedication. Your commitment is remarkable.",
  },
  100: {
    title: "100 Day Champion!",
    message: "A hundred days of seeking God. This is extraordinary faithfulness.",
  },
};

function Confetti() {
  const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    rotation: Math.random() * 360,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 8 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          initial={{
            top: -20,
            left: `${piece.x}%`,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            top: "110%",
            rotate: piece.rotation + 360,
            opacity: 0,
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: piece.delay,
            ease: "easeOut",
          }}
          style={{
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

export function StreakCelebration({ visible, milestone, onClose }: StreakCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const content = milestoneMessages[milestone] || {
    title: `${milestone} Day Streak!`,
    message: `${milestone} days of faithfulness. Keep going!`,
  };

  useEffect(() => {
    if (visible) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {showConfetti && <Confetti />}
          
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            data-testid="modal-streak-celebration"
          >
            <motion.div
              className="bg-card rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Flame className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-serif font-bold text-foreground mb-2" data-testid="text-milestone-title">
                {content.title}
              </h2>
              
              <p className="text-muted-foreground mb-6" data-testid="text-milestone-message">
                {content.message}
              </p>
              
              <Button onClick={onClose} className="w-full" data-testid="button-keep-going">
                Keep Going
              </Button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
