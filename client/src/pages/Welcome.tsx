import { useLocation } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";

import { Logo } from "@/components/Logo";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { setPhase, resetOnboarding } = useOnboarding();

  const handleBegin = () => {
    resetOnboarding();
    setPhase(1);
    setLocation("/onboarding");
  };

  return (
    <>
    {/* ───────────── DESKTOP: editorial split landing ───────────── */}
    <div className="hidden md:flex h-screen overflow-hidden flex-col" style={{ background: "var(--app-bg)" }}>
      {/* Masthead */}
      <header className="flex items-stretch border-b-2 border-[var(--app-dark)]">
        <div className="px-10 py-6 flex items-center border-r border-[var(--app-border)]">
          <span className="font-serif italic text-[30px] text-[var(--app-green)]">SoulGuide</span>
        </div>
        <div className="flex-1 flex items-center px-10">
          <span className="font-serif text-[18px] italic text-[var(--app-gray-lt)]">A space to think and pray</span>
        </div>
        <div className="px-8 flex items-center border-l border-[var(--app-border)]">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--app-gray-lt)]">Est. 2024</span>
        </div>
        <button
          onClick={() => setLocation("/login")}
          className="px-10 flex items-center border-l border-[var(--app-border)] text-[12px] font-semibold tracking-[0.18em] uppercase text-[var(--app-green)] hover:bg-white/40 transition-colors"
        >
          Sign in
        </button>
      </header>

      <div className="flex-1 grid grid-cols-2 min-h-0">
        {/* Left: hero + CTAs */}
        <div className="flex flex-col justify-center items-center text-center px-16 py-10 border-r border-[var(--app-dark)] overflow-y-auto">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--app-gray-lt)]">Faith Companion</span>
              <span className="text-[var(--app-border)]">·</span>
              <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--app-dark)]">Matthew 11:28</span>
            </div>
            <h1 className="font-serif text-[72px] leading-[1.05] text-[var(--app-dark)] mb-8">
              A companion<br />for your faith.
            </h1>
            <p className="text-[20px] leading-[1.6] text-[var(--app-gray)] max-w-[42ch]">
              Wherever you are on your journey, doubting, searching, or simply tired, you don't have to walk it alone.
            </p>
          </div>

          <div className="mt-10 space-y-3 w-full max-w-[440px]">
            <button
              onClick={handleBegin}
              data-testid="button-begin-transformation-desktop"
              className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase transition-opacity hover:opacity-90"
              style={{ background: "var(--cta-bg)", color: "var(--cta-fg)" }}
            >
              Begin your journey
            </button>
            <button
              onClick={() => setLocation("/login")}
              className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase border border-[var(--app-green)] text-[var(--app-green)] hover:bg-white/40 transition-colors"
            >
              I already have an account
            </button>
            <p className="text-[12px] text-[var(--app-gray-lt)] text-center tracking-wide pt-1">Free. No ads. No data selling.</p>
          </div>
        </div>

        {/* Right: image + verse + what's inside */}
        <div className="flex flex-col min-h-0">
          <div className="relative h-[58%] flex-shrink-0 overflow-hidden border-b border-[var(--app-dark)]">
            <img
              src="/welcome.jpg"
              alt="A swan resting on still water"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8">
              <p className="font-serif text-[18px] italic text-white leading-relaxed">
                "Come to me, all who are weary and burdened, and I will give you rest." — Matthew 11:28
              </p>
            </div>
          </div>
          <div className="px-12 py-4 border-b border-[var(--app-border)] flex-shrink-0">
            <h3 className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--app-dark)]">What's inside</h3>
          </div>
          {[
            { tag: "Daily", title: "Personalised Devotionals", sub: "Scripture matched to your struggle, every morning." },
            { tag: "Always on", title: "AI Companion", sub: "Listens without judgment. Remembers your journey." },
            { tag: "Your words", title: "Prayer Journal", sub: "A private space to reflect and record." },
          ].map((item, i) => (
            <div key={i} className="px-12 py-3.5 border-b border-[var(--app-border-soft)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--app-gray-lt)] block mb-1">{item.tag}</span>
                <p className="font-serif text-[24px] text-[var(--app-dark)] mb-1">{item.title}</p>
                <p className="text-[15px] text-[var(--app-gray-lt)]">{item.sub}</p>
              </div>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--app-border)" strokeWidth="1.5" strokeLinecap="square">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ───────────── MOBILE: original layout (unchanged) ───────────── */}
    <div className="md:hidden min-h-screen flex flex-col" style={{ background: "var(--app-bg)" }}>
      {/* Header */}
      <header className="flex bg-[var(--app-white)] border-b border-[var(--app-border)]">
        <div className="flex-1 py-6 px-6 flex items-center">
          <Logo size={28} showWordmark />
        </div>
        <div className="py-6 px-6 flex items-center border-l border-[var(--app-border)]">
          <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[var(--app-gray-lt)]">Est. 2024</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <div className="p-6">
          <div className="bg-[var(--app-white)] p-7">
            {/* Hero image placeholder */}
            <div className="w-full aspect-[4/3] mb-3 overflow-hidden">
              <img
                src="/welcome.jpg"
                alt="A swan resting on still water"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="font-serif text-[13px] italic text-[var(--app-gray-lt)] mb-5 leading-relaxed">
              "Come to me, all who are weary and burdened, and I will give you rest.", Matthew 11:28
            </p>
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-gray-lt)]">Faith Companion</span>
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-dark)]">Matthew 11:28</span>
            </div>
            <h2 className="font-serif text-[40px] leading-[1.15] text-[var(--app-dark)] mb-4">
              A companion<br />for your faith.
            </h2>
            <p className="text-[16px] leading-[1.65] text-[var(--app-gray)]">
              Wherever you are on your journey, doubting, searching, or simply tired, you don't have to walk it alone.
            </p>
          </div>
        </div>

        {/* What's inside */}
        <div className="border-y border-[var(--app-border)] py-5 px-8 bg-[var(--app-white)] flex items-center">
          <h3 className="text-[12px] font-semibold tracking-[0.15em] uppercase text-[var(--app-dark)]">What's inside</h3>
        </div>

        <div className="flex flex-col">
          {[
            { tag: "Daily", title: "Personalised Devotionals", sub: "Scripture matched to your struggle, every morning." },
            { tag: "Always on", title: "AI Companion", sub: "Listens without judgment. Remembers your journey." },
            { tag: "Your words", title: "Prayer Journal", sub: "A private space to reflect and record." },
          ].map((item, i) => (
            <div key={i} className="px-6 py-6 bg-[var(--app-white)] border-b border-[var(--app-border-soft)] flex items-start justify-between">
              <div className="flex-1 pr-4">
                <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--app-gray-lt)] block mb-1">{item.tag}</span>
                <p className="font-serif text-[20px] text-[var(--app-dark)] mb-1">{item.title}</p>
                <p className="text-[14px] text-[var(--app-gray-lt)]">{item.sub}</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-border)" strokeWidth="1.5" strokeLinecap="square">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="p-6 space-y-3 bg-[var(--app-white)] border-t border-[var(--app-border)] mt-4">
          <button
            onClick={handleBegin}
            data-testid="button-begin-transformation"
            className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase"
            style={{ background: "var(--cta-bg)", color: "var(--cta-fg)" }}
          >
            Begin your journey
          </button>
          <button
            onClick={() => setLocation("/login")}
            className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase border border-[var(--app-border)] text-[var(--app-gray-lt)]"
            style={{ background: "transparent" }}
          >
            I already have an account
          </button>
          <p className="text-[11px] text-[var(--app-gray-lt)] text-center tracking-wide">Free. No ads. No data selling.</p>
        </div>
      </main>
    </div>
    </>
  );
}
