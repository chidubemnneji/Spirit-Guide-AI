import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { OnboardingData } from "@shared/schema";

interface OnboardingContextType {
  data: OnboardingData;
  currentPhase: number;
  updateOnboarding: (updates: Partial<OnboardingData>) => void;
  setPhase: (phase: number) => void;
  resetOnboarding: () => void;
  isComplete: boolean;
}

const defaultOnboardingData: OnboardingData = {
  primaryStruggle: null,
  depthLayer: null,
  behavioralReality: null,
  transformationGoals: [],
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
  const [currentPhase, setCurrentPhase] = useState(0);

  const updateOnboarding = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const setPhase = useCallback((phase: number) => {
    setCurrentPhase(phase);
  }, []);

  const resetOnboarding = useCallback(() => {
    setData(defaultOnboardingData);
    setCurrentPhase(0);
  }, []);

  const isComplete = data.transformationGoals.length > 0;

  return (
    <OnboardingContext.Provider
      value={{
        data,
        currentPhase,
        updateOnboarding,
        setPhase,
        resetOnboarding,
        isComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
