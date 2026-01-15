import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { OptionCard } from "./OptionCard";
import { ContinueButton } from "./ContinueButton";
import { BackButton } from "./BackButton";
import { Cloud, HelpCircle, User, Heart, Zap, Sprout } from "lucide-react";

interface Phase1Props {
  onNext: (struggle: string) => void;
  onBack: () => void;
}

const options = [
  {
    id: "distant_from_god",
    icon: <Cloud className="w-7 h-7 text-muted-foreground" />,
    text: "I feel distant from God — prayer feels empty",
  },
  {
    id: "wrestling_doubts",
    icon: <HelpCircle className="w-7 h-7 text-muted-foreground" />,
    text: "I'm wrestling with doubts I can't shake",
  },
  {
    id: "feel_alone",
    icon: <User className="w-7 h-7 text-muted-foreground" />,
    text: "I feel alone in my faith journey",
  },
  {
    id: "guilt_shame",
    icon: <Heart className="w-7 h-7 text-muted-foreground" />,
    text: "I'm carrying guilt or shame I can't let go of",
  },
  {
    id: "life_overwhelming",
    icon: <Zap className="w-7 h-7 text-muted-foreground" />,
    text: "Life is overwhelming and my faith is slipping",
  },
  {
    id: "new_to_faith",
    icon: <Sprout className="w-7 h-7 text-muted-foreground" />,
    text: "I'm new to faith and don't know where to start",
  },
];

export function Phase1({ onNext, onBack }: Phase1Props) {
  const { updateOnboarding } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (optionId: string) => {
    setSelected((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleNext = () => {
    if (selected.length > 0) {
      // Use the first selected as primary for persona assignment
      updateOnboarding({ primaryStruggle: selected[0] });
      onNext(selected[0]);
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-2">
        <BackButton onClick={onBack} />
      </div>

      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-display">
          Before we begin, we want to understand where you are right now.
        </h1>
        <p className="text-lg text-muted-foreground tracking-refined">
          Select all that feel true for you today
        </p>
      </motion.div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <OptionCard
            key={option.id}
            id={option.id}
            text={option.text}
            icon={option.icon}
            selected={selected.includes(option.id)}
            onClick={() => handleSelect(option.id)}
            index={index}
          />
        ))}
      </div>

      <ContinueButton onClick={handleNext} disabled={selected.length === 0} />
    </motion.div>
  );
}
