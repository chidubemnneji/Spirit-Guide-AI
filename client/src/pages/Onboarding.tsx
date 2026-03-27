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
import { Logo } from "@/components/Logo";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

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
  const { refreshUser } = useAuth();

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/onboarding", data);
    },
    onSuccess: async () => {
      await refreshUser();
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
      case 1:
        return (
          <Phase1
            onNext={(struggle: string) => {
              setPhase(2);
            }}
            onBack={handleBack}
          />
        );
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
      case 3:
        return (
          <GoalsStep
            onNext={() => setPhase(4)}
            onBack={handleBack}
          />
        );
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
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 pt-4">
        <Logo size={32} />
        <ThemeToggle />
      </div>
      <ProgressBar currentPhase={currentPhase} totalPhases={TOTAL_STEPS} />
      <main className="pt-24 pb-12">
        <div className="max-w-lg mx-auto px-5">
          {renderStep()}
        </div>
      </main>
    </div>
  );
}
