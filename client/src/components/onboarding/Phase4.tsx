import { useState } from "react";
import { useOnboarding } from "@/context/OnboardingContext";
import { OptionCard } from "./OptionCard";
import { ContinueButton } from "./ContinueButton";
import { BackButton } from "./BackButton";
import { Sparkles } from "lucide-react";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <BackButton onClick={onBack} />
      </div>

      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          Final Step
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
          Imagine it's 3 months from now and things have shifted. What does that look like?
        </h2>
        <p className="text-sm text-muted-foreground">Pick your top 2</p>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <OptionCard
            key={option.id}
            id={option.id}
            text={option.text}
            selected={selected.includes(option.id)}
            disabled={!selected.includes(option.id) && selected.length >= 2}
            onClick={() => handleSelect(option.id)}
          />
        ))}
      </div>

      <ContinueButton
        onClick={handleComplete}
        disabled={selected.length === 0}
        loading={isSubmitting}
        variant="complete"
      >
        Complete Setup & Start Journey
      </ContinueButton>
    </div>
  );
}
