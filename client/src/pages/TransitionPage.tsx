import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

const bibleVerses: Record<string, { verse: string; reference: string; supportingText: string }> = {
  distant_from_god: {
    verse: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
    reference: "Psalm 34:18",
    supportingText: "Even when you can't feel Him, He's there. The silence doesn't mean absence. We'll walk this road together, one day at a time."
  },
  wrestling_doubts: {
    verse: "Lord, I believe; help my unbelief!",
    reference: "Mark 9:24",
    supportingText: "Faith and doubt can coexist. Your questions don't disqualify you, they're part of the journey. Let's explore them together."
  },
  feel_alone: {
    verse: "I will never leave you nor forsake you.",
    reference: "Hebrews 13:5",
    supportingText: "You've taken the hardest step: admitting you need companionship. You're not alone anymore."
  },
  guilt_shame: {
    verse: "There is now no condemnation for those who are in Christ Jesus.",
    reference: "Romans 8:1",
    supportingText: "The guilt you carry isn't yours to carry alone. Grace isn't something you earn, it's something you receive. Let's start there."
  },
  life_overwhelming: {
    verse: "Come to me, all who are weary and burdened, and I will give you rest.",
    reference: "Matthew 11:28",
    supportingText: "Your life is full and overwhelming right now. We're not here to add more pressure, just to walk with you in the moments you have."
  },
  new_to_faith: {
    verse: "I am the way, the truth, and the life.",
    reference: "John 14:6",
    supportingText: "You're at the beginning of something beautiful. There's no rush, no test, no 'right way' except His way. Let's discover it together."
  }
};

const features = [
  { text: "Personalized guidance", delay: 0.3 },
  { text: "Daily devotionals", delay: 0.4 },
  { text: "Scripture-based support", delay: 0.5 },
];

export default function TransitionPage() {
  const [, setLocation] = useLocation();
  const { data } = useOnboarding();
  const [isVisible, setIsVisible] = useState(false);

  const content = bibleVerses[data.primaryStruggle || ""] || bibleVerses.new_to_faith;

  useEffect(() => {
    setIsVisible(true);
    
    const timer = setTimeout(() => {
      setLocation("/devotion");
    }, 12000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  const handleContinue = () => {
    setLocation("/devotion");
  };

  return (
    <div className="min-h-screen flex flex-col gradient-onboarding">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div 
          className="max-w-md text-center space-y-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Check className="w-10 h-10 text-primary" />
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="font-serif text-3xl font-bold">Your space is ready!</h1>
            <p className="text-muted-foreground">
              Your journey has been set up and personalized.
            </p>
          </motion.div>

          <motion.div
            className="p-6 rounded-2xl bg-card shadow-sm space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="font-serif text-lg leading-relaxed italic">
              "{content.verse}"
            </p>
            <p className="text-sm text-muted-foreground">
              {content.reference}
            </p>
          </motion.div>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                className="flex items-center gap-3 justify-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: feature.delay }}
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="pt-4"
          >
            <Button 
              className="w-full h-14 rounded-2xl text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
              onClick={handleContinue}
              data-testid="button-continue"
            >
              Start Your Journey
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
