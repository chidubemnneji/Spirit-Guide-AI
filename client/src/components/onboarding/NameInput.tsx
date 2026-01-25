import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { ContinueButton } from "./ContinueButton";
import { BackButton } from "./BackButton";
import { Input } from "@/components/ui/input";

interface NameInputProps {
  onNext: () => void;
  onBack: () => void;
}

export function NameInput({ onNext, onBack }: NameInputProps) {
  const { updateOnboarding, data } = useOnboarding();
  const [name, setName] = useState(data.userName || "");

  const handleNext = () => {
    if (name.trim()) {
      updateOnboarding({ userName: name.trim() });
      onNext();
    }
  };

  return (
    <motion.div 
      className="space-y-8"
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
          Hello, I'm Soulguide.. what's your name?
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Input
          type="text"
          placeholder="Type in your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-14 text-base rounded-2xl border-2 border-border bg-card px-4"
          data-testid="input-name"
          autoFocus
        />
      </motion.div>

      <ContinueButton onClick={handleNext} disabled={!name.trim()} />
    </motion.div>
  );
}
