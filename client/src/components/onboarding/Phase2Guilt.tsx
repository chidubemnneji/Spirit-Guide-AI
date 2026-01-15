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
  { id: "past_actions", text: "Past actions I regret deeply" },
  { id: "ongoing_struggles", text: "Ongoing struggles I can't seem to overcome" },
  { id: "not_good_enough", text: "A general sense that I'm not good enough" },
  { id: "failing_others", text: "Failing the people I love or letting them down" },
];

const question2Options = [
  { id: "know_but_not_feel", text: "I know God forgives, but I don't feel forgiven" },
  { id: "not_sure_forgiveness", text: "I'm not sure God can forgive what I've done" },
  { id: "forgave_but_returns", text: "I thought I was forgiven, but the guilt keeps returning" },
  { id: "never_asked", text: "I've never really asked for or accepted forgiveness" },
];

export function Phase2Guilt({ onNext, onBack }: Phase2Props) {
  const { updateOnboarding } = useOnboarding();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<{
    guiltSource: string | null;
    forgivenessRelationship: string | null;
  }>({
    guiltSource: null,
    forgivenessRelationship: null,
  });

  const handleSelect = (field: "guiltSource" | "forgivenessRelationship", optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: optionId,
    }));
  };

  const handleNext = () => {
    if (step === 1 && answers.guiltSource) {
      setStep(2);
    } else if (step === 2 && answers.forgivenessRelationship) {
      updateOnboarding({
        depthLayer: {
          guiltSource: answers.guiltSource,
          forgivenessRelationship: answers.forgivenessRelationship,
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
    (step === 1 && answers.guiltSource) || (step === 2 && answers.forgivenessRelationship);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <BackButton onClick={handleBack} />
      </div>

      {step === 1 && (
        <>
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              What is the source of the guilt or shame you carry?
            </h2>
          </div>

          <div className="space-y-3">
            {question1Options.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                text={option.text}
                selected={answers.guiltSource === option.id}
                onClick={() => handleSelect("guiltSource", option.id)}
              />
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              How do you relate to the idea of God's forgiveness?
            </h2>
          </div>

          <div className="space-y-3">
            {question2Options.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                text={option.text}
                selected={answers.forgivenessRelationship === option.id}
                onClick={() => handleSelect("forgivenessRelationship", option.id)}
              />
            ))}
          </div>
        </>
      )}

      <ContinueButton onClick={handleNext} disabled={!canContinue} />
    </div>
  );
}
