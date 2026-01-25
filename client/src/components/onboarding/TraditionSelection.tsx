import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { OptionCard } from "./OptionCard";
import { ContinueButton } from "./ContinueButton";
import { BackButton } from "./BackButton";

interface TraditionSelectionProps {
  onNext: () => void;
  onBack: () => void;
}

const traditions = [
  { id: "catholic", text: "Catholic" },
  { id: "protestant", text: "Protestant" },
  { id: "baptist", text: "Baptist" },
  { id: "evangelical", text: "Evangelical" },
  { id: "non_denominational", text: "Non-denominational" },
  { id: "pentecostal", text: "Pentecostal" },
  { id: "methodist", text: "Methodist" },
  { id: "lutheran", text: "Lutheran" },
  { id: "presbyterian", text: "Presbyterian" },
  { id: "orthodox", text: "Orthodox" },
  { id: "other", text: "Other / Exploring" },
];

export function TraditionSelection({ onNext, onBack }: TraditionSelectionProps) {
  const { updateOnboarding, data } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(data.tradition);

  const handleSelect = (traditionId: string) => {
    setSelected(traditionId);
  };

  const handleNext = () => {
    if (selected) {
      updateOnboarding({ tradition: selected });
      onNext();
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
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          We Honor Your Tradition
        </h1>
        <p className="text-muted-foreground">
          Your guidance will reflect the teachings and values of your faith background.
        </p>
      </motion.div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {traditions.map((tradition, index) => (
          <OptionCard
            key={tradition.id}
            id={tradition.id}
            text={tradition.text}
            selected={selected === tradition.id}
            onClick={() => handleSelect(tradition.id)}
            index={index}
          />
        ))}
      </div>

      <ContinueButton onClick={handleNext} disabled={!selected} />
    </motion.div>
  );
}
