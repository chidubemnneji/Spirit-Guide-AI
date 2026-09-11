import { useState } from "react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, MessageCircle, Sparkles, Timer, Moon, Play, Pause, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Devotional } from "@shared/schema";
import { useFlags } from "@/hooks/useFlags";

function SectionBlock({
  label,
  content,
  accent = false,
  index = 0,
}: {
  label?: string;
  content: string;
  accent?: boolean;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08 }}
      className="px-6 py-6 border-b border-[var(--app-border-soft)]"
      style={{ background: accent ? "var(--app-bg-warm)" : "var(--app-white)" }}
    >
      {label && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2"
          style={{ color: accent ? "var(--app-green)" : "var(--app-gray-lt)" }}>
          {label}
        </p>
      )}
      <p
        className={accent ? "font-serif italic leading-relaxed text-[var(--app-dark)]" : "leading-relaxed text-[var(--app-gray)]"}
        style={{ fontSize: accent ? "calc(18px * var(--reading-scale, 1))" : "calc(15px * var(--reading-scale, 1))" }}
      >
        {content}
      </p>
    </motion.div>
  );
}

function PracticeBlock({ content, index }: { content: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08 }}
      className="px-6 py-6 bg-[var(--app-white)] border-b border-[var(--app-border-soft)]"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--app-green)" }} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--app-gray-lt)" }}>
          Try this today
        </p>
      </div>
      <p className="text-[var(--app-gray)] leading-relaxed" style={{ fontSize: "calc(15px * var(--reading-scale, 1))" }}>{content}</p>
    </motion.div>
  );
}

function PrayerBlock({ content, index }: { content: string; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08 }}
      className="border-b border-[var(--app-border-soft)] overflow-hidden"
      style={{ background: "var(--app-bg-warm)" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--app-green)" }} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--app-green)" }}>
            Closing prayer
          </p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4" style={{ color: "var(--app-green)" }} />
          : <ChevronDown className="w-4 h-4" style={{ color: "var(--app-green)" }} />
        }
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="font-serif italic text-[var(--app-dark)] leading-relaxed px-6 pb-6" style={{ fontSize: "calc(16px * var(--reading-scale, 1))" }}>
              "{content}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TimedModeSection() {
  const flags = useFlags();
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [timedText, setTimedText] = useState<string | null>(null);
  const [eveningText, setEveningText] = useState<string | null>(null);
  const [mode, setMode] = useState<"timed" | "evening" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const timedMutation = useMutation({
    mutationFn: async (duration: number) => {
      const res = await fetch(`/api/devotional/timed?duration=${duration}`, { credentials: "include" });
      return res.json();
    },
    onSuccess: (data) => {
      setTimedText(data.text);
      setMode("timed");
    },
  });

  const eveningMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/prayer/evening", { credentials: "include" });
      return res.json();
    },
    onSuccess: (data) => {
      setEveningText(data.text);
      setMode("evening");
    },
  });

  const playText = async (text: string) => {
    try {
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text, voice: "nova" }),
      });
      const data = await res.json();
      if (data.audio) {
        const blob = new Blob([Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))], { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);
        const el = new Audio(url);
        el.onended = () => setIsPlaying(false);
        el.play();
        setAudio(el);
        setIsPlaying(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const togglePlay = (text: string) => {
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
    } else {
      playText(text);
    }
  };

  if (!flags.TIMED_DEVOTIONALS && !flags.EVENING_PRAYER) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {/* Timed devotionals */}
      {flags.TIMED_DEVOTIONALS && !mode && (
        <div className="px-6 py-6 bg-[var(--app-white)] border-b border-[var(--app-border-soft)]">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-4 h-4" style={{ color: "var(--app-green)" }} />
            <span className="text-[15px] font-semibold text-[var(--app-dark)]">Guided Meditation</span>
          </div>
          <p className="text-[13px] mb-4" style={{ color: "var(--app-gray-lt)" }}>
            A spoken devotional timed to your schedule
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[2, 5, 10, 15].map(d => (
              <button
                key={d}
                onClick={() => { setSelectedDuration(d); timedMutation.mutate(d); }}
                className="py-2.5 text-[13px] font-semibold transition-colors"
                style={
                  selectedDuration === d
                    ? { background: "var(--cta-bg)", color: "var(--cta-fg)" }
                    : { border: "1px solid var(--app-border)", color: "var(--app-dark)" }
                }
              >
                {d}m
              </button>
            ))}
          </div>
          {timedMutation.isPending && (
            <p className="text-[12px] text-center mt-3 animate-pulse" style={{ color: "var(--app-gray-lt)" }}>
              Preparing your meditation...
            </p>
          )}
        </div>
      )}

      {/* Evening prayer */}
      {flags.EVENING_PRAYER && !mode && (
        <button
          onClick={() => eveningMutation.mutate()}
          disabled={eveningMutation.isPending}
          className="w-full px-6 py-6 bg-[var(--app-white)] border-b border-[var(--app-border-soft)] text-left transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <Moon className="w-4 h-4" style={{ color: "var(--app-green)" }} />
            <span className="text-[15px] font-semibold text-[var(--app-dark)]">Evening Prayer</span>
          </div>
          <p className="text-[13px]" style={{ color: "var(--app-gray-lt)" }}>
            {eveningMutation.isPending ? "Preparing your prayer..." : "A gentle prayer to close your day"}
          </p>
        </button>
      )}

      {/* Generated content */}
      {(timedText || eveningText) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-7 border-b border-[var(--app-border-soft)]"
          style={{ background: "var(--app-bg-warm)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {mode === "timed" ? <Timer className="w-4 h-4" style={{ color: "var(--app-green)" }} /> : <Moon className="w-4 h-4" style={{ color: "var(--app-green)" }} />}
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--app-green)" }}>
                {mode === "timed" ? `${selectedDuration}-Minute Meditation` : "Evening Prayer"}
              </span>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
              style={{ border: "1px solid var(--app-green)", color: "var(--app-green)" }}
              onClick={() => togglePlay((timedText || eveningText)!)}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? "Pause" : "Listen"}
            </button>
          </div>
          <p className="text-[var(--app-gray)] leading-relaxed whitespace-pre-line" style={{ fontSize: "calc(15px * var(--reading-scale, 1))" }}>
            {timedText || eveningText}
          </p>
          <button
            onClick={() => { setMode(null); setTimedText(null); setEveningText(null); setSelectedDuration(null); }}
            className="text-[12px] mt-4 transition-colors"
            style={{ color: "var(--app-gray-lt)" }}
          >
            ← Back
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function DevotionalReading() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Audio player overlay state (used by the Listen button + overlay below)
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{ success: boolean; data: Devotional; completedTaskIds: string[] }>({
    queryKey: ["/api/devotional/today"],
    enabled: !!user,
  });

  const devotional = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--app-bg)" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--app-green)" }} />
      </div>
    );
  }

  if (!devotional) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "var(--app-bg)" }}>
        <p className="mb-5" style={{ color: "var(--app-gray-lt)" }}>Today's devotional isn't ready yet.</p>
        <button
          onClick={() => setLocation("/devotion")}
          className="px-6 py-3 text-[12px] font-semibold tracking-[0.15em] uppercase"
          style={{ border: "1px solid var(--app-green)", color: "var(--app-green)" }}
        >
          Go back
        </button>
      </div>
    );
  }

  const sections = [
    devotional.openingHook && { type: "block", label: undefined, content: devotional.openingHook, accent: false },
    devotional.reflectionContent && { type: "block", label: "Reflection", content: devotional.reflectionContent, accent: false },
    devotional.todaysPractice && { type: "practice", content: devotional.todaysPractice },
    devotional.closingPrayer && { type: "prayer", content: devotional.closingPrayer },
  ].filter(Boolean) as Array<{ type: string; label?: string; content: string; accent?: boolean }>;

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--app-bg)" }}>
      {/* Audio Player overlay */}
      {showAudioPlayer && (
        <AudioPlayer
          title={devotional?.title || "Guided Reflection"}
          subtitle={devotional?.scriptureReference || "A moment of stillness"}
          duration={selectedDuration || 600}
          sections={["Presence", "Gratitude", "Review"]}
          onClose={() => setShowAudioPlayer(false)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-stretch bg-[var(--app-white)] border-b border-[var(--app-border)]">
        <button
          onClick={() => setLocation("/devotion")}
          className="py-5 px-5 border-r border-[var(--app-border)]"
          style={{ color: "var(--app-gray-lt)" }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="flex-1 flex items-center font-serif text-[18px] text-[var(--app-dark)] px-5">Today's Devotional</span>
        <button
          onClick={() => setShowAudioPlayer(true)}
          className="flex items-center gap-1.5 px-5 text-[11px] font-semibold tracking-[0.15em] uppercase border-l border-[var(--app-border)]"
          style={{ color: "var(--app-green)" }}
        >
          <Play className="w-3.5 h-3.5" />
          Listen
        </button>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Scripture card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-6 py-7 border-b border-[var(--app-border-soft)]"
          style={{ background: "var(--app-bg-warm)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4" style={{ color: "var(--app-green)" }} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--app-green)" }}>
              Verse of the day
            </span>
          </div>
          <p className="font-serif leading-relaxed italic text-[var(--app-dark)] mb-3" style={{ fontSize: "calc(20px * var(--reading-scale, 1))" }}>
            "{devotional.scriptureText}"
          </p>
          <p className="text-[13px] font-semibold" style={{ color: "var(--app-green)" }}>{devotional.scriptureReference}</p>
          {devotional.title && (
            <p className="text-[12px] mt-3 pt-3 border-t border-[var(--app-border-soft)]" style={{ color: "var(--app-gray-lt)" }}>
              {devotional.title}
            </p>
          )}
        </motion.div>

        {/* Content sections */}
        {sections.map((section, i) => {
          if (section.type === "practice") {
            return <PracticeBlock key={i} content={section.content} index={i} />;
          }
          if (section.type === "prayer") {
            return <PrayerBlock key={i} content={section.content} index={i} />;
          }
          return (
            <SectionBlock
              key={i}
              label={section.label}
              content={section.content}
              accent={section.accent}
              index={i}
            />
          );
        })}

        {/* Timed / Evening modes */}
        <TimedModeSection />

        {/* Begin prayer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="px-6 py-7"
        >
          <button
            className="w-full py-4 flex items-center justify-center gap-2 font-semibold text-[13px] tracking-[0.2em] uppercase"
            style={{ background: "var(--cta-bg)", color: "var(--cta-fg)" }}
            onClick={() => setLocation("/chat?mode=devotional")}
          >
            <MessageCircle className="w-5 h-5" />
            Begin Prayer
          </button>
          <p className="text-[12px] text-center mt-3" style={{ color: "var(--app-gray-lt)" }}>
            Continue the reflection with your companion
          </p>
        </motion.div>
      </main>
    </div>
  );
}
