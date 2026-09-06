import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

const features = [
  { tag: "Memory", title: "Knows Your Journey", sub: "Every conversation builds on what came before. Your companion remembers your struggles and your progress." },
  { tag: "Always on", title: "Available at 3 AM", sub: "No judgment. No waiting. No booking. Just presence, whenever you need it." },
  { tag: "Grounded", title: "Biblically Rooted", sub: "Every answer is shaped by Scripture. Truth, not opinion." },
];

export default function MeetPrayerPartner() {
  const [, setLocation] = useLocation();
  const { refreshUser } = useAuth();

  const handleContinue = async () => {
    await refreshUser();
    setLocation("/chat");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--app-bg)" }}>
      {/* Header */}
      <header className="flex bg-[var(--app-white)] border-b border-[var(--app-border)]">
        <div className="flex-1 py-6 px-6 flex items-center">
          <h1 className="font-serif text-[26px] leading-none text-[var(--app-dark)] tracking-wide">Your Companion</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Intro */}
        <div className="p-6">
          <div className="bg-[var(--app-white)] p-7">
            <div className="w-full aspect-[4/3] mb-7 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80"
                alt="Peaceful forest path at dawn"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-gray-lt)]">Meet your guide</span>
            </div>
            <h2 className="font-serif text-[36px] leading-[1.15] text-[var(--app-dark)] mb-4">
              Your Personal<br />Prayer Partner
            </h2>
            <p className="text-[17px] leading-[1.65] text-[var(--app-gray)]">
              An AI companion that knows your faith journey and walks with you through every season.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="border-y border-[var(--app-border)] py-5 px-8 bg-[var(--app-white)]">
          <h3 className="text-[12px] font-semibold tracking-[0.15em] uppercase text-[var(--app-dark)]">What to expect</h3>
        </div>
        <div className="flex flex-col">
          {features.map((f, i) => (
            <div key={i} className="px-6 py-6 bg-[var(--app-white)] border-b border-[var(--app-border-soft)]">
              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--app-gray-lt)] block mb-1">{f.tag}</span>
              <p className="font-serif text-[20px] text-[var(--app-dark)] mb-1">{f.title}</p>
              <p className="text-[14px] text-[var(--app-gray-lt)] leading-relaxed">{f.sub}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="p-6 bg-[var(--app-white)] border-t border-[var(--app-border)] mt-4">
          <button
            onClick={handleContinue}
            data-testid="button-start-conversation"
            className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase"
            style={{ background: "var(--cta-bg)", color: "var(--cta-fg)" }}
          >
            Start your first conversation
          </button>
        </div>
      </main>
    </div>
  );
}
