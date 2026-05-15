import { useLocation } from "wouter";
import { useOnboarding } from "@/context/OnboardingContext";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { setPhase, resetOnboarding } = useOnboarding();

  const handleBegin = () => {
    resetOnboarding();
    setPhase(1);
    setLocation("/onboarding");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#EBEAE5" }}>
      {/* Header */}
      <header className="flex bg-white border-b border-[#D8D7D2]">
        <div className="flex-1 py-6 px-6 flex items-center">
          <h1 className="font-serif text-[26px] leading-none text-black tracking-wide">Sanctuary</h1>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <div className="p-6">
          <div className="bg-white p-7">
            {/* Hero image placeholder */}
            <div className="w-full aspect-[4/3] mb-7 overflow-hidden bg-[#e9e8e4] flex items-center justify-center">
              <p className="font-serif text-2xl italic text-center leading-relaxed px-8 text-[#1b291d]">
                "Come to me, all who are weary and burdened, and I will give you rest."
              </p>
            </div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#73726C]">Faith Companion</span>
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#111]">Matthew 11:28</span>
            </div>
            <h2 className="font-serif text-[40px] leading-[1.15] text-black mb-4">
              A companion<br />for your faith.
            </h2>
            <p className="text-[17px] leading-[1.65] text-[#545454]">
              Wherever you are on your journey — doubting, searching, or simply tired — you don't have to walk it alone.
            </p>
          </div>
        </div>

        {/* What's inside */}
        <div className="border-y border-[#D8D7D2] py-5 px-8 bg-white flex items-center">
          <h3 className="text-[12px] font-semibold tracking-[0.15em] uppercase text-black">What's inside</h3>
        </div>

        <div className="flex flex-col">
          {[
            { tag: "Daily", title: "Personalised Devotionals", sub: "Scripture matched to your struggle, every morning." },
            { tag: "Always on", title: "AI Companion", sub: "Listens without judgment. Remembers your journey." },
            { tag: "Your words", title: "Prayer Journal", sub: "A private space to reflect and record." },
          ].map((item, i) => (
            <div key={i} className="px-6 py-6 bg-white border-b border-[#f0f0ee] flex items-start justify-between">
              <div className="flex-1 pr-4">
                <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#73726C] block mb-1">{item.tag}</span>
                <p className="font-serif text-[20px] text-black mb-1">{item.title}</p>
                <p className="text-[14px] text-[#73726C]">{item.sub}</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D8D7D2" strokeWidth="1.5" strokeLinecap="square">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="p-6 space-y-3 bg-white border-t border-[#D8D7D2] mt-4">
          <button
            onClick={handleBegin}
            data-testid="button-begin-transformation"
            className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase"
            style={{ background: "#1b291d", color: "#fff" }}
          >
            Begin your journey
          </button>
          <button
            onClick={() => setLocation("/login")}
            className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase border border-[#D8D7D2] text-[#73726C]"
            style={{ background: "transparent" }}
          >
            I already have an account
          </button>
          <p className="text-[11px] text-[#73726C] text-center tracking-wide">Free. No ads. No data selling.</p>
        </div>
      </main>
    </div>
  );
}
