import { useState, useEffect, useRef } from "react";

interface AudioPlayerProps {
  title?: string;
  subtitle?: string;
  duration?: number; // seconds
  sections?: string[];
  onClose?: () => void;
}

export function AudioPlayer({
  title = "Guided Examen",
  subtitle = "Reviewing the day with gratitude",
  duration = 600,
  sections = ["Presence", "Gratitude", "Review"],
  onClose,
}: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1
  const [activeSection, setActiveSection] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const elapsed = Math.floor(progress * duration);
  const remaining = duration - elapsed;
  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 1) { setPlaying(false); return 1; }
          return p + 1 / duration;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, duration]);

  // Waveform bars
  const totalBars = 28;
  const playedBars = Math.floor(progress * totalBars);
  const heights = [12, 18, 14, 28, 22, 40, 48, 36, 70, 90, 65, 110, 130, 95, 120, 80, 105, 70, 85, 55, 65, 40, 45, 28, 20, 14, 8, 12];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#242922" }}>
      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(42,48,40,0.4) 0%, transparent 50%, rgba(17,20,16,0.9) 100%)" }} />

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-6 pt-12 pb-4">
        <button onClick={onClose} className="p-2 text-white/80">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        <button className="p-2 text-white/80">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </button>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-14">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/70 block mb-3">
            {fmtTime(duration).split(":")[0]} Min Session
          </span>
          <h1 className="text-[40px] leading-tight font-serif text-white mb-2">{title}</h1>
          <p className="text-[15px] font-light text-white/70">{subtitle}</p>
        </div>

        {/* Waveform */}
        <div className="flex items-center justify-center gap-[4px] h-[140px] mb-12 w-full">
          {heights.map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full"
              style={{
                height: `${h}px`,
                background: i < playedBars ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>

        {/* Section tabs */}
        <div className="flex items-center justify-center gap-6">
          {sections.map((s, i) => (
            <button
              key={s}
              onClick={() => setActiveSection(i)}
              className="px-5 py-1.5 rounded-full text-[13px] font-light tracking-wide transition-all"
              style={{
                border: activeSection === i ? "1px solid rgba(255,255,255,0.3)" : "none",
                background: activeSection === i ? "rgba(255,255,255,0.05)" : "transparent",
                color: activeSection === i ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </main>

      {/* Footer controls */}
      <footer className="relative z-10 px-8 pb-14 pt-4">
        {/* Progress bar */}
        <div className="mb-10">
          <div className="relative w-full h-[2px] bg-white/20 rounded-full mb-3">
            <div className="absolute top-0 left-0 h-full bg-white rounded-full" style={{ width: `${progress * 100}%` }} />
            {/* Section markers */}
            {sections.map((_, i) => (
              <div key={i} className="absolute top-1/2 -translate-y-1/2 w-[2px]"
                style={{ left: `${((i + 1) / sections.length) * 100}%`, height: "10px", background: progress * 100 > ((i + 1) / sections.length) * 100 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)" }} />
            ))}
          </div>
          <div className="flex justify-between text-[12px] font-light text-white/70">
            <span>{fmtTime(elapsed)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex justify-center items-center gap-14">
          <button onClick={() => setProgress(p => Math.max(0, p - 15 / duration))} className="text-white/70">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button
            onClick={() => setPlaying(p => !p)}
            className="w-[76px] h-[76px] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            style={{ background: "#F4F4F1" }}
          >
            {playing ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#1A1E18]">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#1A1E18] ml-1.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button onClick={() => setProgress(p => Math.min(1, p + 15 / duration))} className="text-white/70">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
