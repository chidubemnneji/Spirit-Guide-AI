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
    mutationFn: async () => apiRequest("POST", "/api/onboarding", data),
    onSuccess: async () => { await refreshUser(); setLocation("/transition"); },
    onError: (error: Error) => toast({ title: "Something went wrong", description: error.message || "Failed to complete onboarding.", variant: "destructive" }),
  });

  const handleBack = useCallback(() => {
    if (currentPhase > 1) setPhase(currentPhase - 1);
    else setLocation("/");
  }, [currentPhase, setPhase, setLocation]);

  const renderStep = () => {
    switch (currentPhase) {
      case 1: return <Phase1 onNext={() => setPhase(2)} onBack={handleBack} />;
      case 2: {
        const Comp = data.primaryStruggle ? phase2Components[data.primaryStruggle] : Phase2DistantFromGod;
        return <Comp onNext={() => setPhase(3)} onBack={handleBack} />;
      }
      case 3: return <GoalsStep onNext={() => setPhase(4)} onBack={handleBack} />;
      case 4: return <SignupStep onComplete={() => submitMutation.mutate()} onBack={handleBack} isSubmitting={submitMutation.isPending} />;
      default: return <Phase1 onNext={() => setPhase(2)} onBack={handleBack} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--app-bg)" }}>
      {/* Desktop masthead */}
      <header className="hidden md:flex items-stretch border-b-2 border-[var(--app-dark)]">
        <div className="px-10 py-5 flex items-center border-r border-[var(--app-border)]">
          <span className="font-serif italic text-[26px] text-[var(--app-green)]">SoulGuide</span>
        </div>
        <div className="flex-1 flex items-center px-10">
          <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--app-gray-lt)]">
            Step {String(currentPhase).padStart(2, "0")} — Shape your journey
          </span>
        </div>
        <div className="px-8 flex items-center border-l border-[var(--app-border)]">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--app-gray-lt)]">Est. 2024</span>
        </div>
      </header>

      <ProgressBar currentPhase={currentPhase} totalPhases={TOTAL_STEPS} />
      <main className="flex-1 pt-[90px] pb-12 md:pt-12 md:px-12 md:flex md:items-center">
        <div className="max-w-lg md:max-w-[1100px] mx-auto px-5 md:px-0 w-full">
          {renderStep()}
        </div>
      </main>

      {/* Desktop ticker */}
      <div className="hidden md:block border-t-2 border-[var(--app-dark)] overflow-hidden">
        <div className="py-3 px-10 flex items-center gap-10 whitespace-nowrap">
          {["Start small.", "Be consistent.", "Stay present.", "Practice gratitude.", "Find peace.", "Start small.", "Be consistent."].map((t, i) => (
            <span key={i} className="font-serif italic text-[16px] text-[var(--app-gray-lt)]">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
