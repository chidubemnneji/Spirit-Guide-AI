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
  { id: "empty_room", text: "Like talking to an empty room" },
  { id: "rushed_mechanical", text: "Rushed and mechanical, just going through motions" },
  { id: "fades_quickly", text: "I feel something but it fades quickly" },
  { id: "dont_know_how", text: "I want to connect but don't know how" },
];

const question2Options = [
  { id: "far_away_now", text: "Yes, but it feels far away now" },
  { id: "not_sure_ever", text: "I'm not sure I ever have" },
  { id: "something_changed", text: "I used to, but something changed" },
  { id: "catch_glimpses", text: "I catch glimpses but can't hold onto them" },
];

export function Phase2DistantFromGod({ onNext, onBack }: Phase2Props) {
  const { updateOnboarding } = useOnboarding();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<{
    prayerExperience: string[];
    pastConnection: string | null;
  }>({
    prayerExperience: [],
    pastConnection: null,
  });

  const handleMultiSelect = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      prayerExperience: prev.prayerExperience.includes(optionId)
        ? prev.prayerExperience.filter((id) => id !== optionId)
        : prev.prayerExperience.length < 2
        ? [...prev.prayerExperience, optionId]
        : prev.prayerExperience,
    }));
  };

  const handleSingleSelect = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      pastConnection: optionId,
    }));
  };

  const handleNext = () => {
    if (step === 1 && answers.prayerExperience.length > 0) {
      setStep(2);
    } else if (step === 2 && answers.pastConnection) {
      updateOnboarding({
        depthLayer: {
          prayerExperience: answers.prayerExperience,
          pastConnection: answers.pastConnection,
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
    (step === 1 && answers.prayerExperience.length > 0) ||
    (step === 2 && answers.pastConnection);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <BackButton onClick={handleBack} />
      </div>

      {step === 1 && (
        <>
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              When you pray or worship, what does it feel like?
            </h2>
            <p className="text-sm text-muted-foreground">
              Select 1-2 that resonate
            </p>
          </div>

          <div className="space-y-3">
            {question1Options.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                text={option.text}
                selected={answers.prayerExperience.includes(option.id)}
                onClick={() => handleMultiSelect(option.id)}
              />
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              Has there been a time when you felt close to God?
            </h2>
          </div>

          <div className="space-y-3">
            {question2Options.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                text={option.text}
                selected={answers.pastConnection === option.id}
                onClick={() => handleSingleSelect(option.id)}
              />
            ))}
          </div>
        </>
      )}

      <ContinueButton onClick={handleNext} disabled={!canContinue} />
    </div>
  );
}
