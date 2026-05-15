import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";
import { useAuth } from "@/context/AuthContext";

const bibleVerses: Record<string, { verse: string; reference: string; supportingText: string }> = {
  distant_from_god: { verse: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.", reference: "Psalm 34:18", supportingText: "Even when you can't feel Him, He's there. The silence doesn't mean absence. We'll walk this road together, one day at a time." },
  wrestling_doubts: { verse: "Lord, I believe; help my unbelief!", reference: "Mark 9:24", supportingText: "Faith and doubt can coexist. Your questions don't disqualify you — they're part of the journey. Let's explore them together." },
  feel_alone: { verse: "I will never leave you nor forsake you.", reference: "Hebrews 13:5", supportingText: "You've taken the hardest step: admitting you need companionship. You're not alone anymore." },
  guilt_shame: { verse: "There is now no condemnation for those who are in Christ Jesus.", reference: "Romans 8:1", supportingText: "The guilt you carry isn't yours to carry alone. Grace isn't something you earn — it's something you receive. Let's start there." },
  life_overwhelming: { verse: "Come to me, all who are weary and burdened, and I will give you rest.", reference: "Matthew 11:28", supportingText: "Your life is full and overwhelming right now. We're not here to add more pressure — just to walk with you in the moments you have." },
  new_to_faith: { verse: "I am the way, the truth, and the life.", reference: "John 14:6", supportingText: "You're at the beginning of something beautiful. There's no rush, no test, no 'right way' except His way. Let's discover it together." },
};

export default function TransitionPage() {
  const [, setLocation] = useLocation();
  const { data } = useOnboarding();
  const { refreshUser } = useAuth();
  const [progress, setProgress] = useState(0);

  const content = bibleVerses[data.primaryStruggle || ""] || bibleVerses.new_to_faith;

  const navigateForward = async () => { await refreshUser(); setLocation("/meet-prayer-partner"); };

  useEffect(() => {
    // Animate progress bar over 10 seconds
    const start = Date.now();
    const duration = 10000;
    const tick = setInterval(() => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setProgress(p);
      if (p >= 1) { clearInterval(tick); navigateForward(); }
    }, 50);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1b291d" }}>
      {/* Progress bar */}
      <div className="h-0.5 bg-white/10 w-full">
        <div className="h-full bg-white/60 transition-all" style={{ width: `${progress * 100}%` }} />
      </div>

      <main className="flex-1 flex flex-col justify-between px-8 py-16">
        {/* Scripture */}
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/50 mb-8">Your space is ready</p>
          <p className="font-serif text-[32px] leading-[1.25] text-white mb-6">
            "{content.verse}"
          </p>
          <p className="text-[13px] font-semibold tracking-[0.12em] uppercase text-white/50">{content.reference}</p>
        </div>

        {/* Supporting text */}
        <div className="border-t border-white/10 pt-8">
          <p className="text-[17px] leading-[1.7] text-white/70 mb-10">{content.supportingText}</p>
          <button
            onClick={navigateForward}
            data-testid="button-continue"
            className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase"
            style={{ background: "#fff", color: "#1b291d" }}
          >
            Continue
          </button>
          <p className="text-[11px] text-white/30 text-center mt-5 leading-relaxed">
            Your companion is AI. It listens well but is not a therapist, pastor, or crisis service.
          </p>
        </div>
      </main>
    </div>
  );
}
