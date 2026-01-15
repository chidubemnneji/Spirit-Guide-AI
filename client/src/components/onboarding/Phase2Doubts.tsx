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
  { id: "intellectual", text: "Intellectual — I have questions I can't answer" },
  { id: "emotional", text: "Emotional — My heart doesn't feel what I think it should" },
  { id: "experiential", text: "Experiential — I haven't seen God work in my life" },
  { id: "triggered_by_life", text: "Triggered by life events that shook my faith" },
];

const question2Options = [
  { id: "scared_losing_faith", text: "Scared — I'm afraid of losing my faith completely" },
  { id: "curious_exploring", text: "Curious — I want to explore and understand more" },
  { id: "frustrated_no_answers", text: "Frustrated — I can't find satisfying answers" },
  { id: "numb_disconnected", text: "Numb — I've stopped caring as much" },
];

export function Phase2Doubts({ onNext, onBack }: Phase2Props) {
  const { updateOnboarding } = useOnboarding();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<{
    doubtType: string | null;
    doubtEmotion: string | null;
  }>({
    doubtType: null,
    doubtEmotion: null,
  });

  const handleSelect = (field: "doubtType" | "doubtEmotion", optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: optionId,
    }));
  };

  const handleNext = () => {
    if (step === 1 && answers.doubtType) {
      setStep(2);
    } else if (step === 2 && answers.doubtEmotion) {
      updateOnboarding({
        depthLayer: {
          doubtType: answers.doubtType,
          doubtEmotion: answers.doubtEmotion,
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
    (step === 1 && answers.doubtType) || (step === 2 && answers.doubtEmotion);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <BackButton onClick={handleBack} />
      </div>

      {step === 1 && (
        <>
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              What kind of doubts do you find yourself wrestling with?
            </h2>
          </div>

          <div className="space-y-3">
            {question1Options.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                text={option.text}
                selected={answers.doubtType === option.id}
                onClick={() => handleSelect("doubtType", option.id)}
              />
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              How do these doubts make you feel?
            </h2>
          </div>

          <div className="space-y-3">
            {question2Options.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                text={option.text}
                selected={answers.doubtEmotion === option.id}
                onClick={() => handleSelect("doubtEmotion", option.id)}
              />
            ))}
          </div>
        </>
      )}

      <ContinueButton onClick={handleNext} disabled={!canContinue} />
    </div>
  );
}
