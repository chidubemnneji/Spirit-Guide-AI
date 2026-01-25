import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { Testimonials } from "@/components/onboarding/Testimonials";
import { NameInput } from "@/components/onboarding/NameInput";
import { TraditionSelection } from "@/components/onboarding/TraditionSelection";
import { AIDemo } from "@/components/onboarding/AIDemo";
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

const TOTAL_PHASES = 8;

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

  const handleNext = useCallback(() => {
    setPhase(currentPhase + 1);
  }, [currentPhase, setPhase]);

  const handleBack = useCallback(() => {
    if (currentPhase > 1) {
      setPhase(currentPhase - 1);
    } else {
      setLocation("/");
    }
  }, [currentPhase, setPhase, setLocation]);

  const handlePhase1Complete = useCallback((struggle: string) => {
    setPhase(6);
  }, [setPhase]);

  const handlePhase2Complete = useCallback(() => {
    setPhase(7);
  }, [setPhase]);

  const handlePhase3Complete = useCallback(() => {
    setPhase(8);
  }, [setPhase]);

  const handlePhase4Complete = useCallback(() => {
    submitMutation.mutate();
  }, [submitMutation]);

  const renderPhase = () => {
    switch (currentPhase) {
      case 0:
      case 1:
        return <Testimonials onNext={handleNext} />;
      case 2:
        return <NameInput onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <TraditionSelection onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <AIDemo onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <Phase1 onNext={handlePhase1Complete} onBack={handleBack} />;
      case 6: {
        const Phase2Component = data.primaryStruggle 
          ? phase2Components[data.primaryStruggle] 
          : Phase2DistantFromGod;
        return <Phase2Component onNext={handlePhase2Complete} onBack={handleBack} />;
      }
      case 7:
        return <Phase3 onNext={handlePhase3Complete} onBack={handleBack} />;
      case 8:
        return (
          <Phase4 
            onComplete={handlePhase4Complete} 
            onBack={handleBack} 
            isSubmitting={submitMutation.isPending} 
          />
        );
      default:
        return <Testimonials onNext={handleNext} />;
    }
  };

  const displayPhase = currentPhase === 0 ? 1 : currentPhase;

  return (
    <div className="min-h-screen gradient-onboarding">
      <ProgressBar currentPhase={displayPhase} totalPhases={TOTAL_PHASES} />
      
      <div className="fixed top-3 right-4 z-50">
        <ThemeToggle />
      </div>

      <main className="pt-24 pb-12">
        <div className="max-w-lg mx-auto px-5">
          {renderPhase()}
        </div>
      </main>
    </div>
  );
}
