import { useCallback } from "react";
import { useLocation } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { Phase1 } from "@/components/onboarding/Phase1";
import { Phase2DistantFromGod } from "@/components/onboarding/Phase2DistantFromGod";
import { Phase2Doubts } from "@/components/onboarding/Phase2Doubts";
import { Phase2Alone } from "@/components/onboarding/Phase2Alone";
import { Phase2Guilt } from "@/components/onboarding/Phase2Guilt";
import { Phase2Overwhelmed } from "@/components/onboarding/Phase2Overwhelmed";
import { Phase2NewToFaith } from "@/components/onboarding/Phase2NewToFaith";
import { GoalsStep } from "@/components/onboarding/GoalsStep";
import { SignupStep } from "@/components/onboarding/SignupStep";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// 4 real steps the user experiences
// 1: Struggle  2: Depth (per struggle)  3: Goals  4: Name + signup
const TOTAL_STEPS = 4;

const phase2Components: Record<string, React.ComponentType<{ onNext: () => void; onBack: () => void }>> = {
  distant_from_god: Phase2DistantFromGod,
  wrestling_doubts: Phase2Doubts,
  feel_alone: Phase2Alone,
  guilt_shame: Phase2Guilt,
  life_overwhelming: Phase2Overwhelmed,
  new_to_faith: Phase2NewToFaith,
};

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { data, currentPhase, setPhase } = useOnboarding();
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/onboarding", data);
    },
    onSuccess: () => {
      setLocation("/transition");
    },
    onError: (error: Error) => {
      toast({
        title: "Something went wrong",
        description: error.message || "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBack = useCallback(() => {
    if (currentPhase > 1) {
      setPhase(currentPhase - 1);
    } else {
      setLocation("/");
    }
  }, [currentPhase, setPhase, setLocation]);

  const renderStep = () => {
    switch (currentPhase) {
      // Step 1 — primary struggle
      case 1:
        return (
          <Phase1
            onNext={(struggle: string) => {
              // struggle is saved inside Phase1 via updateOnboarding
              setPhase(2);
            }}
            onBack={handleBack}
          />
        );

      // Step 2 — depth layer, varies by struggle
      case 2: {
        const DepthComponent = data.primaryStruggle
          ? phase2Components[data.primaryStruggle]
          : Phase2DistantFromGod;
        return (
          <DepthComponent
            onNext={() => setPhase(3)}
            onBack={handleBack}
          />
        );
      }

      // Step 3 — transformation goals
      case 3:
        return (
          <GoalsStep
            onNext={() => setPhase(4)}
            onBack={handleBack}
          />
        );

      // Step 4 — name + signup
      case 4:
        return (
          <SignupStep
            onComplete={() => submitMutation.mutate()}
            onBack={handleBack}
            isSubmitting={submitMutation.isPending}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen gradient-onboarding">
      <ProgressBar currentPhase={currentPhase} totalPhases={TOTAL_STEPS} />

      <div className="fixed top-3 right-4 z-50">
        <ThemeToggle />
      </div>

      <main className="pt-24 pb-12">
        <div className="max-w-lg mx-auto px-5">
          {renderStep()}
        </div>
      </main>
    </div>
  );
}
