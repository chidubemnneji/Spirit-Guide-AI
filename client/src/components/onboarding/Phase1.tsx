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
    icon: <Cloud className="w-6 h-6 text-primary" />,
    text: "I feel distant from God, prayer feels empty",
  },
  {
    id: "wrestling_doubts",
    icon: <HelpCircle className="w-6 h-6 text-primary" />,
    text: "I'm wrestling with doubts I can't shake",
  },
  {
    id: "feel_alone",
    icon: <User className="w-6 h-6 text-primary" />,
    text: "I feel alone in my faith journey",
  },
  {
    id: "guilt_shame",
    icon: <Heart className="w-6 h-6 text-primary" />,
    text: "I'm carrying guilt or shame I can't let go of",
  },
  {
    id: "life_overwhelming",
    icon: <Zap className="w-6 h-6 text-primary" />,
    text: "Life is overwhelming and my faith is slipping",
  },
  {
    id: "new_to_faith",
    icon: <Sprout className="w-6 h-6 text-primary" />,
    text: "I'm new to faith and don't know where to start",
  },
];

export function Phase1({ onNext, onBack }: Phase1Props) {
  const { updateOnboarding } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (optionId: string) => {
    setSelected(optionId);
  };

  const handleNext = () => {
    if (selected) {
      updateOnboarding({ primaryStruggle: selected });
      onNext(selected);
    }
  };

  return (
    <>
    {/* ───── DESKTOP: editorial split ───── */}
    <motion.div
      className="hidden md:grid grid-cols-2 gap-0 min-h-[calc(100vh-180px)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Left: orientation headline */}
      <div className="flex flex-col justify-center pr-14 border-r border-black">
        <span className="text-[12px] font-semibold tracking-[0.25em] uppercase text-[#73726C] mb-6">Orientation</span>
        <h1 className="font-serif text-[56px] leading-[1.05] text-black mb-7">
          What brings<br />you here today?
        </h1>
        <p className="text-[19px] leading-[1.6] text-[#545454] max-w-[40ch]">
          This is a space for intentional faith. Pick the one that feels most true right now, and we'll shape your journey around it.
        </p>
        <div className="mt-12">
          <BackButton onClick={onBack} />
        </div>
      </div>

      {/* Right: struggle options */}
      <div className="flex flex-col justify-center pl-14">
        <div className="space-y-3">
          {options.map((option, index) => (
            <OptionCard
              key={option.id}
              id={option.id}
              text={option.text}
              icon={option.icon}
              selected={selected === option.id}
              onClick={() => handleSelect(option.id)}
              index={index}
            />
          ))}
        </div>
        <div className="mt-8">
          <ContinueButton onClick={handleNext} disabled={!selected} />
        </div>
      </div>
    </motion.div>

    {/* ───── MOBILE: original (unchanged) ───── */}
    <motion.div
      className="md:hidden space-y-6"
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
          What brings you here today?
        </h1>
        <p className="text-muted-foreground">
          Pick the one that feels most true right now
        </p>
      </motion.div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <OptionCard
            key={option.id}
            id={option.id}
            text={option.text}
            icon={option.icon}
            selected={selected === option.id}
            onClick={() => handleSelect(option.id)}
            index={index}
          />
        ))}
      </div>

      <ContinueButton onClick={handleNext} disabled={!selected} />
    </motion.div>
    </>
  );
}
