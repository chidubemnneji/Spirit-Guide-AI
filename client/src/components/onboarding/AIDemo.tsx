import { motion } from "framer-motion";
import { ContinueButton } from "./ContinueButton";
import { BackButton } from "./BackButton";
import { Cross, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIDemoProps {
  onNext: () => void;
  onBack: () => void;
}

export function AIDemo({ onNext, onBack }: AIDemoProps) {
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <BackButton onClick={onBack} />

      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          What Does True Faith Look Like?
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-card rounded-2xl p-4 border border-border"
      >
        <div className="flex items-start gap-3 mb-3">
          <span className="text-sm text-muted-foreground">What does true faith look like in daily life?</span>
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center ml-auto flex-shrink-0">
            <Cross className="w-3 h-3 text-primary" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="bg-card rounded-2xl p-4 border border-border"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
            <Cross className="w-4 h-4 text-background" />
          </div>
          <div className="flex-1">
            <p className="text-foreground text-sm leading-relaxed">
              True faith isn't just Sunday worship, it's living out Christ's love in every moment. 
              It means choosing patience in traffic, showing grace to difficult people, and trusting 
              God's plan when life feels uncertain. As James 2:17 reminds us, "Faith by itself, 
              if it is not accompanied by action, is dead." Your daily choices are your testimony.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
            <Share2 className="w-3 h-3" />
            share
          </Button>
        </div>
      </motion.div>

      <ContinueButton onClick={onNext}>
        Discover Your Personalized Guidance
      </ContinueButton>
    </motion.div>
  );
}
