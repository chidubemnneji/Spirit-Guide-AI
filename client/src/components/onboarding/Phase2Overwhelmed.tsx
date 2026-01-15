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
  { id: "work_career", text: "Work or career demands" },
  { id: "family_responsibilities", text: "Family responsibilities" },
  { id: "health_challenges", text: "Health challenges (mine or loved ones)" },
  { id: "financial_stress", text: "Financial stress" },
  { id: "relationship_issues", text: "Relationship issues" },
  { id: "everything_at_once", text: "Everything all at once" },
];

const question2Options = [
  { id: "want_peace", text: "I want to find peace in the chaos" },
  { id: "need_strength", text: "I need strength to keep going" },
  { id: "seeking_perspective", text: "I'm seeking a different perspective on my situation" },
  { id: "just_survive", text: "I just want to survive right now" },
];

export function Phase2Overwhelmed({ onNext, onBack }: Phase2Props) {
  const { updateOnboarding } = useOnboarding();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<{
    overwhelmSource: string | null;
    whatSeeking: string | null;
  }>({
    overwhelmSource: null,
    whatSeeking: null,
  });

  const handleSelect = (field: "overwhelmSource" | "whatSeeking", optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: optionId,
    }));
  };

  const handleNext = () => {
    if (step === 1 && answers.overwhelmSource) {
      setStep(2);
    } else if (step === 2 && answers.whatSeeking) {
      updateOnboarding({
        depthLayer: {
          overwhelmSource: answers.overwhelmSource,
          whatSeeking: answers.whatSeeking,
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
    (step === 1 && answers.overwhelmSource) || (step === 2 && answers.whatSeeking);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <BackButton onClick={handleBack} />
      </div>

      {step === 1 && (
        <>
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              What's overwhelming you right now?
            </h2>
          </div>

          <div className="space-y-3">
            {question1Options.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                text={option.text}
                selected={answers.overwhelmSource === option.id}
                onClick={() => handleSelect("overwhelmSource", option.id)}
              />
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              What would help you most right now?
            </h2>
          </div>

          <div className="space-y-3">
            {question2Options.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                text={option.text}
                selected={answers.whatSeeking === option.id}
                onClick={() => handleSelect("whatSeeking", option.id)}
              />
            ))}
          </div>
        </>
      )}

      <ContinueButton onClick={handleNext} disabled={!canContinue} />
    </div>
  );
}
