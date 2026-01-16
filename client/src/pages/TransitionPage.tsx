import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";

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
    supportingText: "Your life is full and overwhelming right now. We're not here to add more pressure, just to walk with you in the moments you have. That's enough."
  },
  new_to_faith: {
    verse: "I am the way, the truth, and the life.",
    reference: "John 14:6",
    supportingText: "You're at the beginning of something beautiful. There's no rush, no test, no 'right way' except His way. Let's discover it together, one step at a time."
  }
};

export default function TransitionPage() {
  const [, setLocation] = useLocation();
  const { data } = useOnboarding();
  const [isVisible, setIsVisible] = useState(false);

  const content = bibleVerses[data.primaryStruggle || ""] || bibleVerses.new_to_faith;

  useEffect(() => {
    setIsVisible(true);
    
    const timer = setTimeout(() => {
      setLocation("/chat");
    }, 10000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  const handleContinue = () => {
    setLocation("/chat");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-8">
      <div 
        className={`max-w-2xl text-center space-y-6 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        
        {/* Curvy Road Icon */}
        <div className="mb-14 flex justify-center">
          <svg 
            className="w-56 h-52 opacity-65" 
            viewBox="0 0 200 200"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
          >
            {/* Road base (full width of road) */}
            <path 
              d="M 40 170 Q 60 120, 80 100 T 120 60 T 160 30" 
              stroke="hsl(var(--primary))" 
              strokeWidth="35" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            
            {/* Center dashed line (like highway center line) */}
            <path 
              d="M 40 170 Q 60 120, 80 100 T 120 60 T 160 30" 
              stroke="hsl(var(--primary-foreground))" 
              strokeWidth="2.5" 
              fill="none" 
              strokeDasharray="8 6" 
              strokeLinecap="round" 
            />
            
            {/* Starting point marker (you are here) */}
            <circle cx="40" cy="170" r="6" fill="hsl(var(--primary))" />
          </svg>
        </div>
        
        {/* Bible Verse (quoted) */}
        <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-snug px-4">
          "{content.verse}"
        </h3>
        
        {/* Scripture Reference */}
        <p className="text-base text-muted-foreground font-light italic">
          {content.reference}
        </p>
        
        {/* Supporting Text */}
        <p className="text-sm text-muted-foreground leading-relaxed mt-6 px-8 max-w-lg mx-auto">
          {content.supportingText}
        </p>
        
        {/* Continue Button */}
        <div className="mt-12 pt-8">
          <Button 
            variant="ghost"
            onClick={handleContinue}
            data-testid="button-continue"
          >
            Continue →
          </Button>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center gap-2 mt-8">
          <div className="w-2 h-2 bg-primary/30 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
