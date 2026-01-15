import { useState } from "react";
import { useOnboarding } from "@/context/OnboardingContext";
import { OptionCard } from "./OptionCard";
import { ContinueButton } from "./ContinueButton";
import { BackButton } from "./BackButton";

interface Phase2Props {
  onNext: () => void;
  onBack: () => void;
}

const question1Options = [
  { id: "completely_new", text: "Completely new — I'm just starting to explore" },
  { id: "grew_up_away", text: "I grew up around faith but stepped away" },
  { id: "returning_after_break", text: "Returning after a long break" },
  { id: "different_background", text: "Coming from a different spiritual background" },
];

const question2Options = [
  { id: "curious_exploring", text: "I'm curious and want to learn" },
  { id: "ready_to_commit", text: "I'm ready to commit but don't know how" },
  { id: "skeptical_open", text: "I'm skeptical but open" },
  { id: "seeking_community", text: "I'm looking for community and belonging" },
];

export function Phase2NewToFaith({ onNext, onBack }: Phase2Props) {
  const { updateOnboarding } = useOnboarding();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<{
    faithBackground: string | null;
    currentStance: string | null;
  }>({
    faithBackground: null,
    currentStance: null,
  });

  const handleSelect = (field: "faithBackground" | "currentStance", optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: optionId,
    }));
  };

  const handleNext = () => {
    if (step === 1 && answers.faithBackground) {
      setStep(2);
    } else if (step === 2 && answers.currentStance) {
      updateOnboarding({
        depthLayer: {
          faithBackground: answers.faithBackground,
          currentStance: answers.currentStance,
        },
      });
      onNext();
    }
  };

  const handleBack = () => {
    if (step === 1) {
      onBack();
    } else {
      setStep(step - 1);
    }
  };

  const canContinue =
    (step === 1 && answers.faithBackground) || (step === 2 && answers.currentStance);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <BackButton onClick={handleBack} />
      </div>

      {step === 1 && (
        <>
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              What's your background with faith?
            </h2>
          </div>

          <div className="space-y-3">
            {question1Options.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                text={option.text}
                selected={answers.faithBackground === option.id}
                onClick={() => handleSelect("faithBackground", option.id)}
              />
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              Where are you at in your journey right now?
            </h2>
          </div>

          <div className="space-y-3">
            {question2Options.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                text={option.text}
                selected={answers.currentStance === option.id}
                onClick={() => handleSelect("currentStance", option.id)}
              />
            ))}
          </div>
        </>
      )}

      <ContinueButton onClick={handleNext} disabled={!canContinue} />
    </div>
  );
}
