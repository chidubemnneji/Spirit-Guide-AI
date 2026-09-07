import { useLocation } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";

// Fixed dark palette for this screen only — deliberately not theme-flipped,
// same idea as --scripture-bg. See the .welcome-glow / .welcome-grain
// utilities in index.css for the ambient light behind the hero.
const INK = "#0B0A08";
const PANEL_LINE = "rgba(255,255,255,0.08)";
const GOLD = "#C8A96E";
const PAPER = "#F3EEE4";
const MUTED = "#8B8471";
const MUTED_DIM = "#5E594C";
const BODY = "#B8B0A0";

const FEATURES = [
  { tag: "Daily", title: "Personalised Devotionals", sub: "Scripture matched to your struggle, every morning." },
  { tag: "Always on", title: "AI Companion", sub: "Listens without judgment. Remembers your journey." },
  { tag: "Your words", title: "Prayer Journal", sub: "A private space to reflect and record." },
];

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
      {/* ───────────── DESKTOP: dark cinematic landing ───────────── */}
      <div className="hidden md:flex h-screen overflow-hidden" style={{ background: INK }}>
        {/* Left rail: mark + vertical wordmark */}
        <div className="w-[64px] flex-shrink-0 flex flex-col items-center justify-between py-8" style={{ borderRight: `1px solid ${PANEL_LINE}` }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-serif italic text-[17px]"
            style={{ border: `1px solid ${GOLD}66`, color: GOLD }}
          >
            S
          </div>
          <span
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ writingMode: "vertical-rl", color: MUTED }}
          >
            SoulGuide — Est. 2024
          </span>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Masthead */}
          <header
            className="flex items-center justify-between px-10 py-6 font-mono text-[11px] tracking-[0.2em] uppercase"
            style={{ borderBottom: `1px solid ${PANEL_LINE}`, color: MUTED }}
          >
            <div className="flex items-center gap-9">
              <span className="font-serif italic text-[20px] normal-case tracking-normal" style={{ color: GOLD }}>SoulGuide</span>
              <span>The Word</span>
              <span>The Companion</span>
            </div>
            <button
              onClick={() => setLocation("/login")}
              className="transition-colors"
              style={{ color: GOLD }}
              data-testid="button-signin-desktop"
            >
              Sign in →
            </button>
          </header>

          {/* Hero */}
          <div className="flex-1 relative flex flex-col items-center justify-center text-center px-10 overflow-hidden">
            <div className="welcome-glow" aria-hidden="true" />
            <div className="welcome-grain" aria-hidden="true" />
            <div className="relative z-10 max-w-[720px]">
              <div className="flex items-center justify-center gap-3 mb-7 font-mono text-[11px] tracking-[0.25em] uppercase" style={{ color: MUTED }}>
                <span>Faith Companion</span>
                <span style={{ color: MUTED_DIM }}>·</span>
                <span style={{ color: GOLD }}>Matthew 11:28</span>
              </div>
              <h1 className="font-serif text-[76px] leading-[1.05] mb-7" style={{ color: PAPER }}>
                A companion<br />for your faith.
              </h1>
              <p className="text-[19px] leading-[1.65] max-w-[46ch] mx-auto mb-10" style={{ color: BODY }}>
                Wherever you are on your journey, doubting, searching, or simply tired, you don't have to walk it alone.
              </p>
              <div className="flex flex-col items-center gap-3 w-full max-w-[380px] mx-auto">
                <button
                  onClick={handleBegin}
                  data-testid="button-begin-transformation-desktop"
                  className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase transition-opacity hover:opacity-90"
                  style={{ background: GOLD, color: INK }}
                >
                  Begin your journey
                </button>
                <button
                  onClick={() => setLocation("/login")}
                  className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase transition-colors hover:bg-white/5"
                  style={{ border: `1px solid ${GOLD}55`, color: PAPER }}
                >
                  I already have an account
                </button>
                <p className="text-[11px] tracking-wide pt-1" style={{ color: MUTED_DIM }}>Free. No ads. No data selling.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right rail: methodology-style panel */}
        <aside
          className="w-[300px] flex-shrink-0 flex flex-col py-8 px-7 font-mono overflow-y-auto"
          style={{ borderLeft: `1px solid ${PANEL_LINE}`, color: MUTED }}
        >
          <div className="mb-8">
            <p className="tracking-[0.2em] uppercase text-[10px] mb-2.5" style={{ color: MUTED_DIM }}>Companion Status</p>
            <p className="text-[11px] leading-[1.9] tracking-[0.05em]" style={{ color: GOLD }}>
              LISTENING: ALWAYS<br />
              JUDGMENT: NEVER<br />
              MEMORY: YOUR JOURNEY
            </p>
          </div>

          <div className="mb-7">
            <p className="tracking-[0.2em] uppercase text-[10px] mb-3" style={{ color: MUTED_DIM }}>What's inside</p>
            <p className="font-sans normal-case text-[13px] leading-relaxed" style={{ color: BODY }}>
              Every feature here exists to meet you where you are, and walk with you from there.
            </p>
          </div>

          <div className="space-y-3 flex-1">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-4" style={{ border: `1px solid ${PANEL_LINE}` }}>
                <p className="text-[9px] tracking-[0.18em] uppercase mb-1.5" style={{ color: MUTED_DIM }}>{f.tag}</p>
                <p className="font-serif italic text-[16px] normal-case mb-1" style={{ color: PAPER }}>{f.title}</p>
                <p className="font-sans normal-case text-[12px] leading-relaxed" style={{ color: MUTED }}>{f.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${PANEL_LINE}` }}>
            <p className="tracking-[0.2em] uppercase text-[10px] mb-1" style={{ color: MUTED_DIM }}>Status</p>
            <p className="text-[12px]" style={{ color: GOLD }}>Awaiting your first prayer</p>
          </div>
        </aside>
      </div>

      {/* ───────────── MOBILE: same dark cinematic language ───────────── */}
      <div className="md:hidden min-h-screen flex flex-col" style={{ background: INK }}>
        <header className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${PANEL_LINE}` }}>
          <span className="font-serif italic text-[22px]" style={{ color: GOLD }}>SoulGuide</span>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color: MUTED }}>Est. 2024</span>
        </header>

        <div className="relative flex flex-col items-center text-center px-7 py-14 overflow-hidden">
          <div className="welcome-glow" aria-hidden="true" />
          <div className="welcome-grain" aria-hidden="true" />
          <div className="relative z-10 w-full">
            <div className="flex items-center justify-center gap-2.5 mb-6 font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: MUTED }}>
              <span>Faith Companion</span>
              <span style={{ color: MUTED_DIM }}>·</span>
              <span style={{ color: GOLD }}>Matthew 11:28</span>
            </div>
            <h1 className="font-serif text-[42px] leading-[1.15] mb-5" style={{ color: PAPER }}>
              A companion<br />for your faith.
            </h1>
            <p className="text-[16px] leading-[1.65]" style={{ color: BODY }}>
              Wherever you are on your journey, doubting, searching, or simply tired, you don't have to walk it alone.
            </p>
          </div>
        </div>

        <div className="px-6" style={{ borderTop: `1px solid ${PANEL_LINE}` }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="py-5" style={{ borderBottom: `1px solid ${PANEL_LINE}` }}>
              <p className="font-mono text-[9px] tracking-[0.18em] uppercase mb-1.5" style={{ color: MUTED_DIM }}>{f.tag}</p>
              <p className="font-serif italic text-[19px] mb-1" style={{ color: PAPER }}>{f.title}</p>
              <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}>{f.sub}</p>
            </div>
          ))}
        </div>

        <div className="p-6 space-y-3 mt-auto">
          <button
            onClick={handleBegin}
            data-testid="button-begin-transformation"
            className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase"
            style={{ background: GOLD, color: INK }}
          >
            Begin your journey
          </button>
          <button
            onClick={() => setLocation("/login")}
            className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase"
            style={{ border: `1px solid ${GOLD}55`, color: PAPER, background: "transparent" }}
          >
            I already have an account
          </button>
          <p className="text-[11px] text-center tracking-wide" style={{ color: MUTED_DIM }}>Free. No ads. No data selling.</p>
        </div>
      </div>
    </>
  );
}
