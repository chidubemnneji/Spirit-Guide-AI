import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { OptionCard } from "./OptionCard";
import { ContinueButton } from "./ContinueButton";
import { BackButton } from "./BackButton";
import { Sparkles, Check } from "lucide-react";

interface Phase4Props {
  onComplete: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const options = [
  { id: "gods_presence", text: "I feel God's presence in my daily life" },
  { id: "doubts_controlled", text: "My doubts don't control me anymore" },
  { id: "friends_understand", text: "I have friends who understand my journey" },
  { id: "prayer_meaningful", text: "Prayer actually means something to me" },
  { id: "free_from_guilt", text: "I'm free from the guilt I've been carrying" },
  { id: "faith_steady", text: "My faith is steady, not up and down" },
  { id: "understand_bible", text: "I understand the Bible in a way that matters" },
  { id: "peace_not_anxiety", text: "I wake up with peace instead of anxiety" },
];

export function Phase4({ onComplete, onBack, isSubmitting }: Phase4Props) {
  const { updateOnboarding } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (optionId: string) => {
    if (selected.includes(optionId)) {
      setSelected(selected.filter((id) => id !== optionId));
    } else if (selected.length < 2) {
      setSelected([...selected, optionId]);
    }
  };

  const handleComplete = () => {
    if (selected.length > 0) {
      updateOnboarding({ transformationGoals: selected });
      onComplete();
    }
  };

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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          Final Step
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          Imagine 3 months from now, things have shifted. What does that look like?
        </h1>
        <p className="text-muted-foreground">
          Pick your top 2
        </p>
      </motion.div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <OptionCard
            key={option.id}
            id={option.id}
            text={option.text}
            selected={selected.includes(option.id)}
            disabled={!selected.includes(option.id) && selected.length >= 2}
            onClick={() => handleSelect(option.id)}
            index={index}
          />
        ))}
      </div>

      <ContinueButton
        onClick={handleComplete}
        disabled={selected.length === 0}
        loading={isSubmitting}
        variant="complete"
      >
        Start Your Journey
      </ContinueButton>
    </motion.div>
  );
}
