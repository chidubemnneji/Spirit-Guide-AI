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
  { id: "no_community", text: "I don't have a faith community or church" },
  { id: "community_not_connect", text: "I'm in a community but don't feel connected" },
  { id: "different_from_others", text: "I feel different from other believers around me" },
  { id: "hide_real_self", text: "I hide my real struggles from others" },
];

const question2Options = [
  { id: "want_community", text: "Yes, I want to find or build community" },
  { id: "prefer_private", text: "I prefer to keep my faith more private" },
  { id: "hurt_before", text: "I've been hurt by community before and I'm cautious" },
  { id: "dont_know", text: "I'm not sure what I need" },
];

export function Phase2Alone({ onNext, onBack }: Phase2Props) {
  const { updateOnboarding } = useOnboarding();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<{
    isolationReason: string | null;
    communityDesire: string | null;
  }>({
    isolationReason: null,
    communityDesire: null,
  });

  const handleSelect = (field: "isolationReason" | "communityDesire", optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: optionId,
    }));
  };

  const handleNext = () => {
    if (step === 1 && answers.isolationReason) {
      setStep(2);
    } else if (step === 2 && answers.communityDesire) {
      updateOnboarding({
        depthLayer: {
          isolationReason: answers.isolationReason,
          communityDesire: answers.communityDesire,
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
    (step === 1 && answers.isolationReason) || (step === 2 && answers.communityDesire);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <BackButton onClick={handleBack} />
      </div>

      {step === 1 && (
        <>
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              What makes you feel alone in your faith?
            </h2>
          </div>

          <div className="space-y-3">
            {question1Options.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                text={option.text}
                selected={answers.isolationReason === option.id}
                onClick={() => handleSelect("isolationReason", option.id)}
              />
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              Would you like to be more connected with others in faith?
            </h2>
          </div>

          <div className="space-y-3">
            {question2Options.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                text={option.text}
                selected={answers.communityDesire === option.id}
                onClick={() => handleSelect("communityDesire", option.id)}
              />
            ))}
          </div>
        </>
      )}

      <ContinueButton onClick={handleNext} disabled={!canContinue} />
    </div>
  );
}
