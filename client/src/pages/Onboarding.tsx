import { useState, useCallback } from "react";
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
import { Phase3 } from "@/components/onboarding/Phase3";
import { Phase4 } from "@/components/onboarding/Phase4";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const TOTAL_PHASES = 4;

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
      const response = await apiRequest("POST", "/api/onboarding", data);
      return response;
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

  const handlePhase1Complete = useCallback((struggle: string) => {
    setPhase(2);
  }, [setPhase]);

  const handlePhase2Complete = useCallback(() => {
    setPhase(3);
  }, [setPhase]);

  const handlePhase3Complete = useCallback(() => {
    setPhase(4);
  }, [setPhase]);

  const handlePhase4Complete = useCallback(() => {
    submitMutation.mutate();
  }, [submitMutation]);

  const handleBack = useCallback(() => {
    if (currentPhase > 1) {
      setPhase(currentPhase - 1);
    } else {
      setLocation("/");
    }
  }, [currentPhase, setPhase, setLocation]);

  const renderPhase = () => {
    switch (currentPhase) {
      case 0:
      case 1:
        return <Phase1 onNext={handlePhase1Complete} onBack={handleBack} />;
      case 2: {
        const Phase2Component = data.primaryStruggle 
          ? phase2Components[data.primaryStruggle] 
          : Phase2DistantFromGod;
        return <Phase2Component onNext={handlePhase2Complete} onBack={handleBack} />;
      }
      case 3:
        return <Phase3 onNext={handlePhase3Complete} onBack={handleBack} />;
      case 4:
        return (
          <Phase4 
            onComplete={handlePhase4Complete} 
            onBack={handleBack} 
            isSubmitting={submitMutation.isPending} 
          />
        );
      default:
        return <Phase1 onNext={handlePhase1Complete} onBack={handleBack} />;
    }
  };

  const displayPhase = currentPhase === 0 ? 1 : currentPhase;

  return (
    <div className="min-h-screen bg-background">
      <ProgressBar currentPhase={displayPhase} totalPhases={TOTAL_PHASES} />
      
      <div className="fixed top-3 right-4 z-50">
        <ThemeToggle />
      </div>

      <main className="pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-6">
          {renderPhase()}
        </div>
      </main>
    </div>
  );
}
